"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Search, Brain, Info } from "lucide-react"

interface MedCompareResult {
  originalDrug: string
  originalForm: string
  targetCountry: string
  equivalent: string
  source: "database" | "ai"
  explanation?: string
}

export default function MedCompare() {
  const [drugName, setDrugName] = useState("")
  const [form, setForm] = useState("")
  const [country, setCountry] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<MedCompareResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [forms, setForms] = useState<string[]>([])

  // Common medication forms
  const medicationForms = [
    "tablet",
    "capsule",
    "syrup",
    "injection",
    "cream",
    "ointment",
    "gel",
    "drops",
    "inhaler",
    "patch"
  ]

  // List of countries (can be expanded)
  const countries = [
    "Nigeria",
    "United States",
    "United Kingdom",
    "India",
    "Canada",
    "Australia",
    "South Africa",
    "Ghana",
    "Kenya",
    "UAE"
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!drugName || !form || !country || isLoading) return

    setIsLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch("/api/med-compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drugName: drugName.trim(),
          form: form.trim(),
          country: country.trim()
        })
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError("Failed to find medication equivalents. Please try again.")
      console.error("MedCompare error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>MARMAR MedCompare</CardTitle>
          <p className="text-sm text-gray-600">
            Find equivalent medication names across different countries
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Medication Name</label>
                <Input
                  value={drugName}
                  onChange={(e) => setDrugName(e.target.value)}
                  placeholder="e.g., Panadol"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Form</label>
                <Select value={form} onValueChange={setForm} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select form" />
                  </SelectTrigger>
                  <SelectContent>
                    {medicationForms.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Country</label>
                <Select value={country} onValueChange={setCountry} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading || !drugName || !form || !country}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Find Equivalent
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Search Process Indicator */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Search Process:</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Step 1</Badge>
                  <span>Searched database for {results.originalDrug} ({results.originalForm})</span>
                </div>
                {results.source === "ai" && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Step 2</Badge>
                    <span>Used AI to find equivalent in {results.targetCountry}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Result Display */}
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-green-800">
                    In {results.targetCountry}, {results.originalDrug} {results.originalForm} is known as:
                  </h3>
                  <p className="text-lg font-bold mt-2">{results.equivalent}</p>
                  
                  {results.explanation && (
                    <p className="mt-2 text-sm text-green-700">{results.explanation}</p>
                  )}
                </div>
                {results.source === "ai" && (
                  <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
                    <Brain className="h-3 w-3" />
                    AI Generated
                  </Badge>
                )}
              </div>
            </div>

            {/* Safety Notice */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Always consult with a healthcare professional or pharmacist to verify medication equivalents.
                Medication names and availability may vary by region and over time.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 