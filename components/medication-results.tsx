"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Volume2, Info, AlertTriangle, Brain, Pill, Beaker } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"

interface SearchResult {
  drug: string
  gpt4_form: string
  similarity_score: number
  description?: string
  match_confidence: "High" | "Medium" | "Low"
  ai_explanation?: string
}

interface MedicationResultsProps {
  results: SearchResult[]
  onPlayAudio: (text: string) => void
}

export default function MedicationResults({ results, onPlayAudio }: MedicationResultsProps) {
  const getConfidenceColor = (score: number) => {
    if (score > 80) return "text-green-600"
    if (score > 60) return "text-yellow-600"
    return "text-orange-600"
  }

  const getConfidenceIcon = (score: number) => {
    if (score > 80) return "🟢"
    if (score > 60) return "🟡"
    return "🟠"
  }

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case "High":
        return <Badge className="bg-green-100 text-green-800">High Match</Badge>
      case "Medium":
        return <Badge className="bg-yellow-100 text-yellow-800">Medium Match</Badge>
      case "Low":
        return <Badge className="bg-orange-100 text-orange-800">Low Match</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">No matching medications found in the database.</p>
          <p className="text-sm text-gray-500 mt-2">Try rephrasing your search or use different keywords.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Search Results</span>
          <Badge variant="secondary">{results.length} medications found</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {results.map((result, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{getConfidenceIcon(result.similarity_score)}</span>
                  <h3 className="font-semibold text-lg">{result.drug}</h3>
                  {getConfidenceBadge(result.match_confidence)}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Pill className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-600">Form:</span>
                    <span className="text-sm">{result.gpt4_form}</span>
                  </div>

                  {result.description && (
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-gray-600 mt-1" />
                      <div>
                        <span className="text-sm font-medium text-gray-600">Description:</span>
                        <p className="text-sm text-gray-700">{result.description}</p>
                      </div>
                    </div>
                  )}

                  {/* AI Explanations */}
                  {result.ai_explanation && (
                    <div className="mt-4 space-y-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-800">AI-Generated Insights</span>
                      </div>
                      <div className="space-y-4">
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            className="text-sm text-gray-700"
                            components={{
                              h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2" {...props} />,
                              h2: ({node, ...props}) => <h2 className="text-base font-semibold mb-2" {...props} />,
                              p: ({node, ...props}) => <p className="mb-2" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                              li: ({node, ...props}) => <li className="mb-1" {...props} />
                            }}
                          >
                            {result.ai_explanation}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right space-y-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Match Score</p>
                  <p className={`text-lg font-bold ${getConfidenceColor(result.similarity_score)}`}>
                    {result.similarity_score.toFixed(1)}%
                  </p>
                  <Progress value={result.similarity_score} className="w-20 h-2" />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onPlayAudio(`${result.drug} is available as ${result.gpt4_form}. ${result.description || ""}`)
                  }
                  className="w-full"
                >
                  <Volume2 className="h-3 w-3 mr-1" />
                  Listen
                </Button>
              </div>
            </div>

            {/* Safety Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-xs text-blue-800">
                  <p className="font-medium">Important Safety Information</p>
                  <p>
                    Always consult with a healthcare professional before taking any medication. This information is for
                    educational purposes only.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* General Disclaimer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mt-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Medical Disclaimer</p>
              <p>
                The information provided is for educational purposes only and should not replace professional medical
                advice. Always consult with a qualified healthcare provider before starting, stopping, or changing any
                medication.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
