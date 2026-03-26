import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    const library = await prisma.library.findUnique({
      where: { slug },
      include: {
        categories: { include: { category: true } },
        platforms: { include: { platform: true } },
        languages: { include: { language: true } },
        developer: true,
        organization: true,
        versions: { orderBy: { releasedAt: 'desc' } },
        features: true,
        dependsOn: { include: { dependsOn: true } },
      },
    })

    if (!library) {
      return NextResponse.json({ error: 'Library not found' }, { status: 404 })
    }

    const result = {
      id: library.id,
      name: library.name,
      slug: library.slug,
      shortSummary: library.shortSummary,
      description: library.description,
      functionDesc: library.functionDesc,
      socialImpact: library.socialImpact,
      exampleCode: library.exampleCode,
      officialUrl: library.officialUrl,
      repositoryUrl: library.repositoryUrl,
      costMinUSD: library.costMinUSD,
      costMaxUSD: library.costMaxUSD,
      scrapedAt: library.scrapedAt,
      dataSource: library.dataSource,
      createdAt: library.createdAt,
      updatedAt: library.updatedAt,
      developer: library.developer
        ? { id: library.developer.id, name: library.developer.name, url: library.developer.url }
        : null,
      organization: library.organization
        ? { id: library.organization.id, name: library.organization.name, url: library.organization.url }
        : null,
      categories: library.categories.map((c) => ({ id: c.category.id, name: c.category.name })),
      platforms: library.platforms.map((p) => ({ id: p.platform.id, name: p.platform.name })),
      languages: library.languages.map((l) => ({ id: l.language.id, name: l.language.name })),
      versions: library.versions.map((v) => ({
        id: v.id,
        name: v.name,
        releasedAt: v.releasedAt,
        notes: v.notes,
      })),
      features: library.features.map((f) => ({
        id: f.id,
        name: f.name,
        spec: f.spec,
        required: f.required,
      })),
      dependencies: library.dependsOn.map((d) => ({
        id: d.id,
        name: d.dependsOn.name,
        slug: d.dependsOn.slug,
      })),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching library:', error)
    return NextResponse.json({ error: 'Failed to fetch library' }, { status: 500 })
  }
}
