import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const languages = await prisma.language.findMany({
      where: { libraries: { some: {} } },
      include: { _count: { select: { libraries: true } } },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(languages)
  } catch (error) {
    console.error('Error fetching languages:', error)
    return NextResponse.json({ error: 'Failed to fetch languages' }, { status: 500 })
  }
}
