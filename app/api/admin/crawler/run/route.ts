import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { crawlNpm } from '@/etl/crawlers/npm'
import { crawlPyPI } from '@/etl/crawlers/pypi'
import { crawlApache } from '@/etl/crawlers/apache'

export const dynamic = 'force-dynamic'

// Kept at 1 per source — this route runs incrementally from the admin UI.
// Bulk crawling is done offline via the CLI scripts (pnpm crawl).
const PER_SOURCE_NEW = 1

// Each backfill call makes 1–2 external network requests (npm/PyPI), each taking ~0.5–2s.
// Keeping this at 2 ensures backfill completes well within the route timeout.
const BACKFILL_LIMIT = 2

// Render's reverse proxy hard-kills connections at ~30s. We use 18s to leave
// room for cold-start overhead and the final DB queries / JSON serialization.
const ROUTE_TIMEOUT_MS = 18_000

// Extracts the first real code block from markdown — same logic as the crawlers.
function extractCode(text: string | undefined): string | null {
  if (!text) return null
  let m = text.match(/```(?:js|javascript|ts|typescript|jsx|tsx|python|py)[ \t]*\n([\s\S]{20,}?)\n```/)
  if (m) return m[1].trim().slice(0, 2000)
  m = text.match(/```[ \t]*\n([\s\S]{20,}?)\n```/)
  return m ? m[1].trim().slice(0, 2000) : null
}

// Fetch real example code from source APIs for libraries that have none.
async function backfillExampleCode(): Promise<number> {
  const libs = await prisma.library.findMany({
    where: { exampleCode: null, dataSource: { in: ['npm-crawler', 'pypi-crawler'] } },
    select: { id: true, name: true, dataSource: true },
    take: BACKFILL_LIMIT,
    orderBy: { createdAt: 'asc' },
  })

  let updated = 0
  for (const lib of libs) {
    try {
      let code: string | null = null
      if (lib.dataSource === 'npm-crawler') {
        const enc = lib.name.startsWith('@')
          ? '@' + encodeURIComponent(lib.name.slice(1))
          : lib.name
        const r = await fetch(`https://registry.npmjs.org/${enc}`)
        if (r.ok) code = extractCode((await r.json()).readme)
        await new Promise((res) => setTimeout(res, 150))
      } else if (lib.dataSource === 'pypi-crawler') {
        const r = await fetch(`https://pypi.org/pypi/${encodeURIComponent(lib.name)}/json`)
        if (r.ok) code = extractCode((await r.json()).info?.description)
        await new Promise((res) => setTimeout(res, 200))
      }
      if (code) {
        await prisma.library.update({ where: { id: lib.id }, data: { exampleCode: code } })
        updated++
        console.log(`[crawler] backfill exampleCode: ${lib.name}`)
      }
    } catch (e) {
      console.warn(`[crawler] backfill failed for ${lib.name}:`, e instanceof Error ? e.message : e)
    }
  }
  return updated
}

// Counts libraries in DB grouped by dataSource field
async function countBySource() {
  const rows = await prisma.library.groupBy({
    by: ['dataSource'],
    _count: { _all: true },
  })
  const map: Record<string, number> = {}
  for (const row of rows) {
    map[row.dataSource ?? 'unknown'] = row._count._all
  }
  return map
}

// POST /api/admin/crawler/run
// Body: { action: 'crawl' }
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[crawler] POST received — starting crawl run')

    // Snapshot counts BEFORE so we can compute deltas after
    const before      = await countBySource()
    const totalBefore = await prisma.library.count()

    console.log(`[crawler] DB before: ${totalBefore}`, before)

    type SourceResult = { success: number; failed: number }
    let npmResult:    SourceResult = { success: 0, failed: 0 }
    let pypiResult:   SourceResult = { success: 0, failed: 0 }
    let apacheResult: SourceResult = { success: 0, failed: 0 }
    const sourceErrors: Record<string, string> = {}
    let backfilled = 0
    let timedOut = false

    // Race the crawler work against the timeout fence. Without this, a slow or
    // hanging external API (npm/PyPI/Apache) would block the route indefinitely
    // and Render would kill the connection mid-response with no error to the client.
    const crawlWork = async () => {
      console.log('[crawler] starting npm (discovery, new only)...')
      try {
        npmResult = await crawlNpm({ limit: 0, skipDiscovery: false, discoveryLimit: PER_SOURCE_NEW })
        console.log(`[crawler] npm done: ${npmResult.success} ok, ${npmResult.failed} failed`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        sourceErrors.npm = msg
        console.error('[crawler] npm error:', msg)
      }

      console.log('[crawler] starting pypi (discovery, new only)...')
      try {
        pypiResult = await crawlPyPI({ limit: 0, skipDiscovery: false, discoveryLimit: PER_SOURCE_NEW })
        console.log(`[crawler] pypi done: ${pypiResult.success} ok, ${pypiResult.failed} failed`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        sourceErrors.pypi = msg
        console.error('[crawler] pypi error:', msg)
      }

      console.log('[crawler] starting apache (new only)...')
      try {
        apacheResult = await crawlApache({ limit: PER_SOURCE_NEW, newOnly: true })
        console.log(`[crawler] apache done: ${apacheResult.success} ok, ${apacheResult.failed} failed`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        sourceErrors.apache = msg
        console.error('[crawler] apache error:', msg)
      }

      console.log('[crawler] backfilling example code...')
      try {
        backfilled = await backfillExampleCode()
        console.log(`[crawler] backfilled ${backfilled} example codes`)
      } catch (err) {
        console.warn('[crawler] backfill error:', err instanceof Error ? err.message : err)
      }
    }

    const timeoutFence = new Promise<void>((resolve) =>
      setTimeout(() => { timedOut = true; resolve() }, ROUTE_TIMEOUT_MS)
    )

    await Promise.race([crawlWork(), timeoutFence])

    if (timedOut) {
      console.warn(`[crawler] hit ${ROUTE_TIMEOUT_MS}ms wall — returning partial result`)
    }

    // Compare DB counts before and after — the delta is the true number of newly
    // inserted libraries. The crawlers use upsert, so their "success" counter
    // includes both inserts and updates; only the delta reflects real additions.
    const after      = await countBySource()
    const totalAfter = await prisma.library.count()
    const delta      = (key: string) => (after[key] ?? 0) - (before[key] ?? 0)

    console.log(`[crawler] done — DB after: ${totalAfter} (+${totalAfter - totalBefore}), backfilled=${backfilled}, timedOut=${timedOut}`)

    return NextResponse.json({
      success: true,
      timedOut,
      crawl: {
        before:     totalBefore,
        after:      totalAfter,
        inserted:   totalAfter - totalBefore,
        backfilled,
        sources: {
          npm:    { inserted: delta('npm-crawler'), success: npmResult.success, failed: npmResult.failed, error: sourceErrors.npm ?? null },
          pypi:   { inserted: delta('pypi-crawler'), success: pypiResult.success, failed: pypiResult.failed, error: sourceErrors.pypi ?? null },
          apache: { inserted: delta('apache-crawler'), success: apacheResult.success, failed: apacheResult.failed, error: sourceErrors.apache ?? null },
        },
        totalInDb: totalAfter,
      },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[crawler] route error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
