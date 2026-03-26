import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Scale, ExternalLink, Code2, Globe, GitCompare } from 'lucide-react'

interface ResultCardProps {
  id: string
  name: string
  slug: string
  shortSummary: string | null
  functionDesc: string | null
  developer: string | null
  organization: string | null
  categories: string[]
  platforms: string[]
  languages: string[]
  costMinUSD: number | null
  costMaxUSD: number | null
}

const LANGUAGE_COLORS: Record<string, string> = {
  Python: '#3572A5',
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  'C#': '#178600',
  Ruby: '#701516',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
}

export function ResultCard({
  name, slug, shortSummary, functionDesc, developer, organization,
  categories, platforms, languages, costMinUSD,
}: ResultCardProps) {
  const isFree = costMinUSD === 0 || costMinUSD === null
  const author = developer || organization

  return (
    <div className="group border rounded-xl bg-card p-5 card-hover flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/sip/${slug}`}
              className="text-base font-semibold hover:text-primary transition-colors truncate"
            >
              {name}
            </Link>
            <Badge
              variant="outline"
              className={`text-xs shrink-0 ${isFree ? 'border-green-200 text-green-700 bg-green-50' : 'border-amber-200 text-amber-700 bg-amber-50'}`}
            >
              {isFree ? 'Free' : 'Paid'}
            </Badge>
          </div>
          {author && (
            <p className="text-xs text-muted-foreground">by {author}</p>
          )}
        </div>
      </div>

      {/* Description */}
      {(functionDesc || shortSummary) && (
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {functionDesc || shortSummary}
        </p>
      )}

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* Languages with colored dots */}
        {languages.length > 0 && (
          <div className="flex items-center gap-1.5">
            {languages.slice(0, 3).map((lang) => (
              <span key={lang} className="flex items-center gap-1 text-xs text-muted-foreground">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/10"
                  style={{ backgroundColor: LANGUAGE_COLORS[lang] ?? '#8b8b8b' }}
                />
                {lang}
              </span>
            ))}
          </div>
        )}

        {/* Categories */}
        {categories.slice(0, 2).map((cat) => (
          <Badge key={cat} variant="secondary" className="text-xs">
            {cat}
          </Badge>
        ))}

        {/* Platforms */}
        {platforms.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Globe className="h-3 w-3" />
            {platforms.slice(0, 3).join(' · ')}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t">
        <Link href={`/sip/${slug}`} className="flex-1">
          <Button size="sm" className="w-full h-8 text-xs">
            View Details
          </Button>
        </Link>
        <Link href={`/compare?slugs=${slug}`}>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
            <GitCompare className="h-3.5 w-3.5" />
            Compare
          </Button>
        </Link>
      </div>
    </div>
  )
}
