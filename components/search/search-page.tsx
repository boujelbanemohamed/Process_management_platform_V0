"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { SearchService } from "@/lib/search"
import type { SearchResult } from "@/lib/search"
import { Search, Filter, Clock, FileText, FolderOpen, Users, ChevronRight } from "lucide-react"
import Link from "next/link"

export function SearchPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["process", "document", "entity"])
  const [selectedCategory, setSelectedCategory] = useState("")
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    setRecentSearches(SearchService.getRecentSearches())
  }, [])

  useEffect(() => {
    if (query.length > 2) {
      setSuggestions(SearchService.getSuggestions(query))
    } else {
      setSuggestions([])
    }
  }, [query])

  const handleSearch = () => {
    if (!query.trim()) return

    setIsSearching(true)
    const searchResults = SearchService.search(query, {
      type: selectedTypes,
      category: selectedCategory || undefined,
    })
    setResults(searchResults)
    SearchService.addRecentSearch(query)
    setRecentSearches(SearchService.getRecentSearches())
    setIsSearching(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "process":
        return <FileText className="h-4 w-4" />
      case "document":
        return <FolderOpen className="h-4 w-4" />
      case "entity":
        return <Users className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "process":
        return "Processus"
      case "document":
        return "Document"
      case "entity":
        return "Entité"
      default:
        return type
    }
  }

  const groupedResults = results.reduce(
    (acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = []
      }
      acc[result.type].push(result)
      return acc
    },
    {} as Record<string, SearchResult[]>,
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Recherche</h1>
        <p className="text-slate-600 mt-1">Trouvez rapidement vos processus, documents et entités</p>
      </div>

      {/* Search Bar */}
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Rechercher dans tous les contenus..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 text-lg h-12"
                />
                {suggestions.length > 0 && query.length > 2 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-md mt-1 shadow-lg z-10">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setQuery(suggestion)}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button onClick={handleSearch} disabled={isSearching} className="bg-slate-800 hover:bg-slate-700 h-12">
                {isSearching ? "Recherche..." : "Rechercher"}
              </Button>
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="h-12">
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="border-t border-slate-200 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Types de contenu</label>
                    <div className="flex flex-wrap gap-2">
                      {["process", "document", "entity"].map((type) => (
                        <button
                          key={type}
                          onClick={() => toggleType(type)}
                          className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm border transition-colors ${
                            selectedTypes.includes(type)
                              ? "bg-slate-800 text-white border-slate-800"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {getTypeIcon(type)}
                          <span>{getTypeLabel(type)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Catégorie</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="">Toutes les catégories</option>
                      <option value="Ressources Humaines">Ressources Humaines</option>
                      <option value="Ventes">Ventes</option>
                      <option value="Production">Production</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Searches */}
      {recentSearches.length > 0 && !query && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-800 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recherches récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(search)}
                  className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm hover:bg-slate-200 transition-colors"
                >
                  {search}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-800">
              {results.length} résultat(s) pour "{query}"
            </h2>
          </div>

          {Object.entries(groupedResults).map(([type, typeResults]) => (
            <Card key={type} className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center">
                  {getTypeIcon(type)}
                  <span className="ml-2">
                    {getTypeLabel(type)}s ({typeResults.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {typeResults.map((result) => (
                    <Link key={result.id} href={result.url}>
                      <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-800 text-balance">{result.title}</h3>
                          <p className="text-sm text-slate-600 mt-1 text-pretty">{result.description}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            {result.category && (
                              <Badge variant="outline" className="text-xs">
                                {result.category}
                              </Badge>
                            )}
                            {result.tags?.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Results */}
      {query && results.length === 0 && !isSearching && (
        <Card className="border-slate-200">
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">Aucun résultat trouvé</h3>
            <p className="text-slate-500 mb-4">Essayez avec des mots-clés différents ou vérifiez l'orthographe.</p>
            <Button variant="outline" onClick={() => setQuery("")}>
              Effacer la recherche
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
