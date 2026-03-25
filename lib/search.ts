import { Client } from 'typesense'

const TYPESENSE_HOST = process.env.TYPESENSE_HOST

let client: Client | null = null

if (TYPESENSE_HOST) {
  try {
    client = new Client({
      nodes: [
        {
          host: TYPESENSE_HOST,
          port: parseInt(process.env.TYPESENSE_PORT || '443'),
          protocol: (process.env.TYPESENSE_PROTOCOL || 'https') as 'http' | 'https',
        },
      ],
      apiKey: process.env.TYPESENSE_API_KEY || '',
      connectionTimeoutSeconds: 5,
    })
    console.log('Typesense client initialized successfully.')
  } catch (e) {
    console.error('Failed to instantiate Typesense Client:', e)
  }
} else {
  console.warn('⚠️ Typesense client initialization skipped. TYPESENSE_HOST not found.')
}

export const searchClient = client
export const SIP_COLLECTION = 'libraries'

/**
 * Initialize Typesense collection schema for Libraries.
 * Schema improvements:
 *  - Added `tags` field (keywords from npm/pypi, extracted terms)
 *  - No forced default_sorting_field so text-match score drives ranking
 *  - All text fields optional so partial data still indexes cleanly
 */
export async function initializeSearchIndex() {
  if (!client) {
    console.warn('Cannot initialize index: Typesense client is not available.')
    return null
  }
  try {
    try {
      const collection = await client.collections(SIP_COLLECTION).retrieve()
      console.log('Search collection already exists:', collection.name)
      return collection
    } catch (error) {
      const typedError = error as { httpStatus?: number }
      if (typedError.httpStatus === 404) {
        console.log('Creating new search collection...')
      } else {
        throw error
      }
    }

    const schema = {
      name: SIP_COLLECTION,
      enable_nested_fields: true,
      fields: [
        // Core identity — always present
        { name: 'id',   type: 'string' as const },
        { name: 'name', type: 'string' as const },
        { name: 'slug', type: 'string' as const },

        // Searchable text — all optional so partial records still index
        { name: 'shortSummary', type: 'string' as const, optional: true },
        { name: 'description',  type: 'string' as const, optional: true },
        { name: 'functionDesc', type: 'string' as const, optional: true },

        // Enriched keyword tags (npm keywords, pypi classifiers, derived terms)
        { name: 'tags', type: 'string[]' as const, optional: true },

        // Facetable dimensions
        { name: 'categories',   type: 'string[]' as const, facet: true },
        { name: 'platforms',    type: 'string[]' as const, facet: true },
        { name: 'languages',    type: 'string[]' as const, facet: true },
        { name: 'developer',    type: 'string' as const,   facet: true, optional: true },
        { name: 'organization', type: 'string' as const,   facet: true, optional: true },

        // Numeric (used for license filter only — not for default sort)
        { name: 'costMinUSD', type: 'int32' as const, optional: true },
        { name: 'costMaxUSD', type: 'int32' as const, optional: true },
      ],
      // No default_sorting_field → text-match score is the primary rank signal
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const collection = await client.collections().create(schema as any)
    console.log('Search collection created successfully:', collection.name)
    return collection
  } catch (error) {
    console.error('Failed to initialize search collection:', error)
    throw error
  }
}

/**
 * Delete and recreate the search collection (use when schema changes).
 */
export async function resetSearchIndex() {
  if (!client) {
    console.warn('Cannot reset index: Typesense client is not available.')
    return null
  }
  try {
    await client.collections(SIP_COLLECTION).delete()
    console.log('Deleted existing search collection')
  } catch (error) {
    const typedError = error as { httpStatus?: number }
    if (typedError.httpStatus !== 404) throw error
  }
  return initializeSearchIndex()
}
