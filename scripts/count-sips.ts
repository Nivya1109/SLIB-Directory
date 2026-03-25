import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const totalLibraries = await prisma.library.count();
  const totalCategories = await prisma.category.count();
  const totalPlatforms = await prisma.platform.count();
  const totalLanguages = await prisma.language.count();
  const totalVersions = await prisma.version.count();
  const totalFeatures = await prisma.feature.count();

  console.log('\n📊 Database Statistics:');
  console.log('─────────────────────────');
  console.log(`Libraries:     ${totalLibraries}`);
  console.log(`Categories:    ${totalCategories}`);
  console.log(`Platforms:     ${totalPlatforms}`);
  console.log(`Languages:     ${totalLanguages}`);
  console.log(`Versions:      ${totalVersions}`);
  console.log(`Features:      ${totalFeatures}`);
  console.log('─────────────────────────\n');

  const byCategory = await prisma.category.findMany({
    include: { _count: { select: { libraries: true } } },
    orderBy: { name: 'asc' },
  });

  console.log('📁 Libraries by Category:');
  byCategory.forEach((cat) => {
    console.log(`  ${cat.name}: ${cat._count.libraries}`);
  });

  console.log('\n');

  const byLanguage = await prisma.language.findMany({
    include: { _count: { select: { libraries: true } } },
    orderBy: { name: 'asc' },
  });

  console.log('💻 Libraries by Language:');
  byLanguage.forEach((lang) => {
    console.log(`  ${lang.name}: ${lang._count.libraries}`);
  });

  console.log('\n');

  await prisma.$disconnect();
}

main();
