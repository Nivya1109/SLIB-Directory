import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 180 // 3 min — crawlers are slow

const execAsync = promisify(exec)

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

    // Snapshot counts BEFORE so we can compute deltas after
    const before      = await countBySource()
    const totalBefore = await prisma.library.count()

    console.log('[crawler] starting — DB before:', totalBefore, before)

    const projectRoot = path.resolve(process.cwd())
    let stdout = ''
    let stderr = ''

    try {
      const out = await execAsync('pnpm run crawl', {
        cwd:     projectRoot,
        timeout: 180_000,
        env:     { ...process.env },
      })
      stdout = out.stdout ?? ''
      stderr = out.stderr ?? ''
    } catch (crawlErr) {
      const e = crawlErr as { stdout?: string; stderr?: string; message?: string }
      stdout = e.stdout ?? ''
      stderr = e.stderr ?? ''
      const msg = e.message ?? String(crawlErr)
      console.error('[crawler] process failed:', msg)
      console.error('[crawler] stderr:', stderr.substring(0, 1000))
      return NextResponse.json(
        { error: `Crawl process failed: ${msg}`, detail: stderr.substring(0, 500) },
        { status: 500 },
      )
    }

    // Log raw output for debugging
    console.log('[crawler] stdout:\n', stdout.substring(0, 2000))
    if (stderr) console.warn('[crawler] stderr:\n', stderr.substring(0, 500))

    // Snapshot counts AFTER — deltas are the ground truth
    const after      = await countBySource()
    const totalAfter = await prisma.library.count()
    const delta      = (key: string) => (after[key] ?? 0) - (before[key] ?? 0)

    console.log('[crawler] DB after:', totalAfter, after)

    return NextResponse.json({
      success: true,
      crawl: {
        before:   totalBefore,
        after:    totalAfter,
        inserted: totalAfter - totalBefore,
        sources: {
          npm:    delta('npm-crawler'),
          pypi:   delta('pypi-crawler'),
          apache: delta('apache-crawler'),
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
