"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Database, Activity, TrendingUp, Pill, BarChart3, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DatabaseStatsProps {
  systemStatus: {
    database: boolean
  }
}

interface DatabaseStats {
  totalMedications: number
  formDistribution: Array<{
    form: string
    count: number
    percentage: number
  }>
  recentSearches: number
  popularSearches: Array<{
    query: string
    count: number
  }>
}

export default function DatabaseStats({ systemStatus }: DatabaseStatsProps) {
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/database-stats")

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to fetch database statistics")
      }

      const data = await response.json()
      setStats(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load database statistics")
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading database statistics...</span>
        </CardContent>
      </Card>
    )
  }

  if (error || !stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Error Loading Statistics</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchStats} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Medications */}
      <Card>
        <CardHeader>
          <CardTitle>Total Medications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalMedications.toLocaleString()}</div>
        </CardContent>
      </Card>

      {/* Form Distribution */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Medication Forms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.formDistribution.map((form) => (
              <div key={form.form} className="flex items-center justify-between">
                <span className="text-sm font-medium">{form.form}</span>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 mr-2">
                    {form.count.toLocaleString()} ({form.percentage.toFixed(1)}%)
                  </span>
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${form.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Popular Searches */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Searches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.popularSearches.map((search) => (
              <div key={search.query} className="flex items-center justify-between">
                <span className="text-sm">{search.query}</span>
                <Badge variant="secondary">{search.count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Database Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Connection Status</span>
              {error ? (
                <Badge variant="destructive">Error</Badge>
              ) : (
                <Badge className="bg-green-100 text-green-800">Connected</Badge>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Data Source</span>
              <Badge variant="secondary">MongoDB Atlas</Badge>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
