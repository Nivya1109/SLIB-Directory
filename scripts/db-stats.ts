import { prisma } from '../lib/prisma'

async function main() {
  const total = await prisma.library.count()

  const noExamples = await prisma.library.count({
    where: { exampleCode: null }
  })

  const incompleteMetadata = await prisma.library.count({
    where: {
      OR: [
        { description: null },
        { shortSummary: null },
        { functionDesc: null }
      ]
    }
  })

  // Approximate source breakdown via developer/org names
  const npm = await prisma.library.count({
    where: {
      OR: [
        { tags: { has: 'npm' } },
        { developer: { name: { contains: 'npm', mode: 'insensitive' } } },
        { organization: { name: { contains: 'npm', mode: 'insensitive' } } },
      ]
    }
  })

  const pypi = await prisma.library.count({
    where: {
      OR: [
        { tags: { has: 'pypi' } },
        { languages: { some: { language: { name: { equals: 'Python', mode: 'insensitive' } } } } },
      ]
    }
  })

  const apache = await prisma.library.count({
    where: {
      OR: [
        { organization: { name: { contains: 'apache', mode: 'insensitive' } } },
        { developer: { name: { contains: 'apache', mode: 'insensitive' } } },
      ]
    }
  })

  console.log('=== DB STATS ===')
  console.log('Total libraries:', total)
  console.log('No example code:', noExamples, `(${((noExamples/total)*100).toFixed(1)}%)`)
  console.log('Incomplete metadata:', incompleteMetadata, `(${((incompleteMetadata/total)*100).toFixed(1)}%)`)
  console.log('NPM (approx):', npm)
  console.log('PyPI (approx):', pypi)
  console.log('Apache (approx):', apache)
  console.log('Seed (curated):', 21)

  await prisma.$disconnect()
}

main().catch(console.error)
