'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface FilterOption {
  id: string
  name: string
  _count?: { libraries: number }
}

interface FacetFiltersProps {
  categories: FilterOption[]
  platforms: FilterOption[]
  languages: FilterOption[]
  selectedCategory: string
  selectedPlatform: string
  selectedLanguage: string
  licenseType: string
  onCategoryChange: (value: string) => void
  onPlatformChange: (value: string) => void
  onLanguageChange: (value: string) => void
  onLicenseTypeChange: (value: string) => void
  onClearFilters: () => void
}

export function FacetFilters({
  categories,
  platforms,
  languages,
  selectedCategory,
  selectedPlatform,
  selectedLanguage,
  licenseType,
  onCategoryChange,
  onPlatformChange,
  onLanguageChange,
  onLicenseTypeChange,
  onClearFilters,
}: FacetFiltersProps) {
  const hasFilters = selectedCategory || selectedPlatform || selectedLanguage || licenseType

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/50 sticky top-20">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Filters</h3>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-7 px-2">
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Category */}
        <div>
          <Label htmlFor="category" className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
            Category
          </Label>
          <Select value={selectedCategory || 'all'} onValueChange={onCategoryChange}>
            <SelectTrigger id="category" className="h-9 text-sm">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>
                  {cat.name}
                  {cat._count?.libraries ? ` (${cat._count.libraries})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Platform / OS */}
        <div>
          <Label htmlFor="platform" className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
            Platform / OS
          </Label>
          <Select value={selectedPlatform || 'all'} onValueChange={onPlatformChange}>
            <SelectTrigger id="platform" className="h-9 text-sm">
              <SelectValue placeholder="All Platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {platforms.map((p) => (
                <SelectItem key={p.id} value={p.name}>
                  {p.name}
                  {p._count?.libraries ? ` (${p._count.libraries})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Language */}
        <div>
          <Label htmlFor="language" className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
            Language
          </Label>
          <Select value={selectedLanguage || 'all'} onValueChange={onLanguageChange}>
            <SelectTrigger id="language" className="h-9 text-sm">
              <SelectValue placeholder="All Languages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              {languages.map((l) => (
                <SelectItem key={l.id} value={l.name}>
                  {l.name}
                  {l._count?.libraries ? ` (${l._count.libraries})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* License type */}
        <div>
          <Label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
            License
          </Label>
          <div className="space-y-2">
            {[
              { value: '', label: 'Any' },
              { value: 'free', label: 'Free / Open Source' },
              { value: 'paid', label: 'Paid / Commercial' },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="licenseType"
                  value={opt.value}
                  checked={licenseType === opt.value}
                  onChange={() => onLicenseTypeChange(opt.value)}
                  className="h-4 w-4"
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
