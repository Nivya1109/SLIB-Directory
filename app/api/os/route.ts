import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// This endpoint now returns platforms (macOS, Windows, Linux, Web, etc.)
export async function GET() {
  try {
    const platforms = await prisma.platform.findMany({
      where: { libraries: { some: {} } },
      include: { _count: { select: { libraries: true } } },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(platforms)
  } catch (error) {
    console.error('Error fetching platforms:', error)
    return NextResponse.json({ error: 'Failed to fetch platforms' }, { status: 500 })
  }
}
