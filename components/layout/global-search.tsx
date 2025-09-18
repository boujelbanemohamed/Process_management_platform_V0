"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { SearchService } from "@/lib/search"
import type { SearchResult } from "@/lib/search"
import { Search, FileText, FolderOpen, Users } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function GlobalSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (query.length > 2) {
      const searchResults = SearchService.search(query).slice(0, 5)
      setResults(searchResults)
      setIsOpen(true)
      setSelectedIndex(-1)
    } else {
      setResults([])
      setIsOpen(false)
    }
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0 && results[selectedIndex]) {
          router.push(results[selectedIndex].url)
          setIsOpen(false)
          setQuery("")
        } else if (query) {
          router.push(`/search?q=${encodeURIComponent(query)}`)
          setIsOpen(false)
          setQuery("")
        }
        break
      case "Escape":
        setIsOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "process":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "document":
        return <FolderOpen className="h-4 w-4 text-green-500" />
      case "entity":
        return <Users className="h-4 w-4 text-purple-500" />
      default:
        return <Search className="h-4 w-4 text-slate-500" />
    }
  }

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          ref={inputRef}
          placeholder="Recherche rapide..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 2 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="pl-10 bg-slate-100 border-slate-200 focus:bg-white"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-md mt-1 shadow-lg z-50 max-h-80 overflow-y-auto">
          {results.map((result, index) => (
            <Link key={result.id} href={result.url}>
              <div
                className={`flex items-center space-x-3 p-3 hover:bg-slate-50 cursor-pointer ${
                  index === selectedIndex ? "bg-slate-50" : ""
                }`}
              >
                {getTypeIcon(result.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{result.title}</p>
                  <p className="text-xs text-slate-500 truncate">{result.description}</p>
                </div>
              </div>
            </Link>
          ))}
          {query && (
            <Link href={`/search?q=${encodeURIComponent(query)}`}>
              <div className="flex items-center space-x-3 p-3 hover:bg-slate-50 cursor-pointer border-t border-slate-100">
                <Search className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-600">Voir tous les résultats pour "{query}"</span>
              </div>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
