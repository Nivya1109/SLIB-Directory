// Typesense Indexing Script
// Indexes all Libraries from PostgreSQL to Typesense

import { prisma } from '../lib/prisma';
import { searchClient, SIP_COLLECTION, initializeSearchIndex } from '../lib/search';

interface SearchDocument {
  id: string;
  name: string;
  slug: string;
  categories: string[];
  platforms: string[];
  languages: string[];
  developer: string;
  organization: string;
  shortSummary: string;
  description: string;
  functionDesc: string;
  tags: string[];
  costMinUSD: number;
  costMaxUSD: number;
}

async function indexLibraries() {
  console.log('Starting library indexing to Typesense...');

  try {
    await initializeSearchIndex();

    const libraries = await prisma.library.findMany({
      include: {
        categories: { include: { category: true } },
        platforms: { include: { platform: true } },
        languages: { include: { language: true } },
        developer: true,
        organization: true,
      },
    });

    const documents: SearchDocument[] = libraries.map((lib) => ({
      id: lib.id,
      name: lib.name,
      slug: lib.slug,
      categories: lib.categories.map((c) => c.category.name),
      platforms: lib.platforms.map((p) => p.platform.name),
      languages: lib.languages.map((l) => l.language.name),
      developer: lib.developer?.name || '',
      organization: lib.organization?.name || '',
      shortSummary: lib.shortSummary || '',
      description: lib.description || '',
      functionDesc: lib.functionDesc || '',
      tags: lib.tags || [],
      costMinUSD: lib.costMinUSD || 0,
      costMaxUSD: lib.costMaxUSD || 0,
    }));

    console.log(`Indexing ${documents.length} libraries to Typesense...`);

    if (documents.length > 0 && searchClient) {
      const result = await searchClient
        .collections(SIP_COLLECTION)
        .documents()
        .import(documents, { action: 'upsert' });

      console.log(`Indexing completed: ${documents.length} documents indexed`);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errors = result.filter((r: any) => !r.success);
      if (errors.length > 0) {
        console.warn(`${errors.length} documents had errors:`, errors);
      }
    } else if (!searchClient) {
      console.warn('Typesense client not available — skipping index upload.');
    } else {
      console.log('No documents to index');
    }
  } catch (error) {
    console.error('Indexing failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  indexLibraries();
}

export { indexLibraries };
