'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Layers, Code2, Building2, Globe, DollarSign } from 'lucide-react'

interface AdminStats {
  totalLibraries: number
  librariesPerCategory: Array<{ category: string; count: number }>
  librariesPerLanguage: Array<{ language: string; count: number }>
  librariesByOrg: Array<{ org: string; count: number }>
  licenseBreakdown: { free: number; paid: number }
}

interface RecentLibrary {
  id: string
  name: string
  slug: string
  shortSummary: string | null
  dataSource: string | null
  scrapedAt: string | null
  categories: Array<{ category: { name: string } }>
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recent, setRecent] = useState<RecentLibrary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, recentRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/sips?pageSize=5'),
        ])
        const statsData = await statsRes.json()
        const recentData = await recentRes.json()
        setStats(statsData)
        setRecent(recentData.libraries || recentData.results || [])
      } catch (err) {
        console.error('Admin load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-muted rounded" />)}
        </div>
        <div className="h-64 bg-muted rounded" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Database overview and library statistics</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Libraries</p>
                <p className="text-3xl font-bold">{stats?.totalLibraries ?? '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Layers className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Categories</p>
                <p className="text-3xl font-bold">{stats?.librariesPerCategory.length ?? '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Code2 className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Languages</p>
                <p className="text-3xl font-bold">{stats?.librariesPerLanguage.length ?? '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-amber-500" />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">License</p>
                {stats ? (
                  <>
                    <p className="text-sm"><span className="font-bold">{stats.licenseBreakdown.free}</span> free</p>
                    <p className="text-sm"><span className="font-bold">{stats.licenseBreakdown.paid}</span> paid</p>
                    <p className="text-sm"><span className="font-bold">{stats.totalLibraries - stats.licenseBreakdown.free - stats.licenseBreakdown.paid}</span> unknown</p>
                  </>
                ) : '—'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Libraries by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" /> Libraries by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats?.librariesPerCategory.slice(0, 10).map((row) => (
                <div key={row.category} className="flex items-center justify-between">
                  <span className="text-sm">{row.category}</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 bg-blue-500 rounded"
                      style={{ width: `${Math.round((row.count / (stats?.totalLibraries || 1)) * 120)}px` }}
                    />
                    <span className="text-sm font-medium w-6 text-right">{row.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Libraries by Language */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5" /> Libraries by Language
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats?.librariesPerLanguage.slice(0, 10).map((row) => (
                <div key={row.language} className="flex items-center justify-between">
                  <span className="text-sm">{row.language}</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 bg-purple-500 rounded"
                      style={{ width: `${Math.round((row.count / (stats?.totalLibraries || 1)) * 120)}px` }}
                    />
                    <span className="text-sm font-medium w-6 text-right">{row.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Organizations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Top Organizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats?.librariesByOrg.slice(0, 8).map((row) => (
                <div key={row.org} className="flex items-center justify-between">
                  <span className="text-sm truncate max-w-[200px]">{row.org}</span>
                  <Badge variant="secondary">{row.count}</Badge>
                </div>
              ))}
              {(!stats?.librariesByOrg || stats.librariesByOrg.length === 0) && (
                <p className="text-sm text-muted-foreground">No organization data</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Libraries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" /> Recent Libraries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recent.slice(0, 8).map((lib) => (
                <div key={lib.id} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <a
                      href={`/sip/${lib.slug}`}
                      className="text-sm font-medium hover:underline text-primary truncate block"
                    >
                      {lib.name}
                    </a>
                    {lib.shortSummary && (
                      <p className="text-xs text-muted-foreground truncate">{lib.shortSummary}</p>
                    )}
                  </div>
                  {lib.dataSource && (
                    <Badge variant="outline" className="text-xs shrink-0">{lib.dataSource}</Badge>
                  )}
                </div>
              ))}
              {recent.length === 0 && (
                <p className="text-sm text-muted-foreground">No libraries found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
