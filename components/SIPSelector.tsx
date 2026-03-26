'use client'

import { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface LibraryOption {
  id: string
  name: string
  slug: string
  categories: string[]
  languages: string[]
}

interface SIPSelectorProps {
  selectedSlug: string
  onSelect: (slug: string) => void
  excludeSlugs?: string[]
}

export function SIPSelector({ selectedSlug, onSelect, excludeSlugs = [] }: SIPSelectorProps) {
  const [libraries, setLibraries] = useState<LibraryOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/sips?pageSize=100')
      .then((r) => r.json())
      .then((data) => setLibraries(data.results || []))
      .catch((e) => console.error('Failed to fetch libraries:', e))
      .finally(() => setLoading(false))
  }, [])

  const available = libraries.filter((lib) => !excludeSlugs.includes(lib.slug))

  if (loading) {
    return <div className="h-10 bg-muted rounded animate-pulse" />
  }

  return (
    <Select value={selectedSlug} onValueChange={onSelect}>
      <SelectTrigger>
        <SelectValue placeholder="Select a library..." />
      </SelectTrigger>
      <SelectContent>
        {available.map((lib) => (
          <SelectItem key={lib.id} value={lib.slug}>
            <span className="font-medium">{lib.name}</span>
            {lib.languages.length > 0 && (
              <span className="text-xs text-muted-foreground ml-2">
                {lib.languages.slice(0, 2).join(', ')}
              </span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
