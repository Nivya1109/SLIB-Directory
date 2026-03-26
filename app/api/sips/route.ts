import { NextRequest, NextResponse } from 'next/server'
import { searchLibraries } from '@/lib/searchService'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category') || ''
    const platform = searchParams.get('platform') || ''
    const language = searchParams.get('language') || ''
    const licenseType = searchParams.get('licenseType') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const searchResults = await searchLibraries({
      query,
      category,
      platform,
      language,
      licenseType,
      page,
      pageSize,
    })

    return NextResponse.json(searchResults)
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Failed to search libraries' }, { status: 500 })
  }
}
