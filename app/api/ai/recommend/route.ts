import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST /api/ai/recommend
// Body: { query: string }
export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AI unavailable' }, { status: 503 })
  }

  let query: string
  try {
    const body = await request.json()
    query = (body.query ?? '').trim()
    if (!query || query.length < 5) {
      return NextResponse.json({ error: 'Please describe what you want to build.' }, { status: 400 })
    }
    if (query.length > 500) {
      return NextResponse.json({ error: 'Description too long (max 500 characters).' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Fetch a capped sample of 100 libraries to stay within the LLM's context/token budget.
  // Ordered by createdAt (oldest first) to keep results deterministic across requests —
  // a random sample would produce inconsistent recommendations for the same query.
  // Only libraries with a shortSummary are included so the AI has enough context to judge.
  const libs = await prisma.library.findMany({
    where: { shortSummary: { not: null } },
    select: {
      name: true,
      slug: true,
      shortSummary: true,
      categories: { select: { category: { select: { name: true } } } },
      languages: { select: { language: { select: { name: true } } } },
    },
    take: 100,
    orderBy: { createdAt: 'asc' },
  })

  if (libs.length === 0) {
    return NextResponse.json({ error: 'No libraries in database yet.' }, { status: 503 })
  }

  // Compact one-line format to stay within token limits
  const libraryList = libs
    .map((lib) => {
      const cats = lib.categories.map((c) => c.category.name).join(', ')
      const langs = lib.languages.map((l) => l.language.name).join(', ')
      const meta = [cats, langs].filter(Boolean).join(' | ')
      return `- ${lib.name} [${lib.slug}]${meta ? ` (${meta})` : ''}: ${lib.shortSummary}`
    })
    .join('\n')

  const prompt = `You are a software library recommender. A developer says:

"${query}"

Here are the available libraries in the database:
${libraryList}

Pick exactly 3 libraries from the list above that best match the developer's need. Only recommend libraries from the list — do not invent or suggest any others.

Respond with ONLY valid JSON in this exact format, nothing else:
[
  {"slug": "library-slug", "name": "Library Name", "reason": "One sentence explaining why this fits their need."},
  {"slug": "library-slug", "name": "Library Name", "reason": "One sentence explaining why this fits their need."},
  {"slug": "library-slug", "name": "Library Name", "reason": "One sentence explaining why this fits their need."}
]`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 300,
        // Low temperature (0.3) to get reliable, structured JSON output.
        // Higher values cause the model to deviate from the required format.
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[ai/recommend] Groq error:', res.status, err)
      return NextResponse.json({ error: 'AI unavailable right now.' }, { status: 502 })
    }

    const data = await res.json() as { choices: Array<{ message: { content: string } }> }
    const raw = data.choices[0]?.message?.content ?? ''

    // Extract JSON array from the response
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.error('[ai/recommend] no JSON in response:', raw)
      return NextResponse.json({ error: 'AI returned an unexpected response.' }, { status: 502 })
    }

    const recommendations = JSON.parse(jsonMatch[0]) as Array<{
      slug: string
      name: string
      reason: string
    }>

    // Cross-check returned slugs against the DB sample we gave the model.
    // LLMs occasionally hallucinate library names that sound plausible but don't exist —
    // this filter ensures the UI never links to a non-existent detail page.
    const validSlugs = new Set(libs.map((l) => l.slug))
    const verified = recommendations.filter((r) => validSlugs.has(r.slug)).slice(0, 3)

    return NextResponse.json({ recommendations: verified })
  } catch (err) {
    console.error('[ai/recommend] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'AI unavailable right now.' }, { status: 502 })
  }
}
