'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  onSearch?: () => void
  defaultValue?: string
}

interface Suggestion {
  id: string
  name: string
  slug: string
  categories: string[]
  shortSummary?: string
  highlightedName: string
}

const LANGUAGE_COLORS: Record<string, string> = {
  Python: '#3572A5', JavaScript: '#f1e05a', TypeScript: '#3178c6',
  Java: '#b07219', Go: '#00ADD8', Rust: '#dea584', 'C#': '#178600',
}

export function SearchBar({ onSearch, defaultValue = '' }: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const router = useRouter()
  const debounceTimerRef = useRef<NodeJS.Timeout>()
  const wrapperRef = useRef<HTMLDivElement>(null)

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    setIsLoading(true)
    try {
      const response = await fetch(`/api/suggestions?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      setSuggestions(data.suggestions || [])
      setShowSuggestions(true)
    } catch {
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleInputChange = useCallback((value: string) => {
    setQuery(value)
    setSelectedIndex(-1)
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => fetchSuggestions(value), 300)
  }, [fetchSuggestions])

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setShowSuggestions(false)
      onSearch?.()
    }
  }, [query, router, onSearch])

  const handleSuggestionClick = useCallback((slug: string) => {
    router.push(`/sip/${slug}`)
    setShowSuggestions(false)
    onSearch?.()
  }, [router, onSearch])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => prev < suggestions.length - 1 ? prev + 1 : prev)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault()
          handleSuggestionClick(suggestions[selectedIndex].slug)
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }, [showSuggestions, suggestions, selectedIndex, handleSuggestionClick])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
        setSelectedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
      <div ref={wrapperRef} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-4 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, language, or describe what you need…"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className="w-full h-12 pl-11 pr-28 rounded-xl border bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
          {isLoading && (
            <Loader2 className="absolute right-20 h-4 w-4 text-muted-foreground animate-spin" />
          )}
          <button
            type="submit"
            className="absolute right-2 h-8 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1"
          >
            Search <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-xl shadow-lg z-50 overflow-hidden divide-y">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                type="button"
                className={cn(
                  'w-full px-4 py-3 text-left transition-colors flex items-start justify-between gap-3',
                  selectedIndex === index ? 'bg-accent' : 'hover:bg-muted/50'
                )}
                onClick={() => handleSuggestionClick(suggestion.slug)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" dangerouslySetInnerHTML={{ __html: suggestion.highlightedName }} />
                  {suggestion.shortSummary && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{suggestion.shortSummary}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                  {suggestion.categories.slice(0, 1).map((cat) => (
                    <Badge key={cat} variant="secondary" className="text-xs">{cat}</Badge>
                  ))}
                </div>
              </button>
            ))}
            <button
              type="submit"
              onClick={handleSearch as any}
              className="w-full px-4 py-2.5 text-left text-sm text-primary hover:bg-accent transition-colors flex items-center gap-2 font-medium"
            >
              <Search className="h-3.5 w-3.5" />
              Search for &ldquo;{query}&rdquo;
            </button>
          </div>
        )}
      </div>
    </form>
  )
}
