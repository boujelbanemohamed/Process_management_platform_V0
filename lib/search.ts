import { mockProcesses, mockDocuments, mockEntities } from "./data"

export interface SearchResult {
  id: string
  type: "process" | "document" | "entity"
  title: string
  description: string
  category?: string
  tags?: string[]
  url: string
  relevance: number
}

export class SearchService {
  static search(
    query: string,
    filters?: {
      type?: string[]
      category?: string
      dateFrom?: Date
      dateTo?: Date
    },
  ): SearchResult[] {
    if (!query.trim()) return []

    const results: SearchResult[] = []
    const searchTerm = query.toLowerCase()

    // Search in processes
    if (!filters?.type || filters.type.includes("process")) {
      mockProcesses.forEach((process) => {
        const relevance = this.calculateRelevance(searchTerm, process.name, process.description, process.tags)
        if (relevance > 0) {
          results.push({
            id: process.id,
            type: "process",
            title: process.name,
            description: process.description,
            category: process.category,
            tags: process.tags,
            url: `/processes/${process.id}`,
            relevance,
          })
        }
      })
    }

    // Search in documents
    if (!filters?.type || filters.type.includes("document")) {
      mockDocuments.forEach((document) => {
        const relevance = this.calculateRelevance(searchTerm, document.name, "", [])
        if (relevance > 0) {
          const process = mockProcesses.find((p) => p.id === document.processId)
          results.push({
            id: document.id,
            type: "document",
            title: document.name,
            description: `Document ${document.type.toUpperCase()} - ${process?.name || "Processus inconnu"}`,
            category: process?.category,
            url: `/documents/${document.id}`,
            relevance,
          })
        }
      })
    }

    // Search in entities
    if (!filters?.type || filters.type.includes("entity")) {
      mockEntities.forEach((entity) => {
        const relevance = this.calculateRelevance(searchTerm, entity.name, entity.description, [])
        if (relevance > 0) {
          results.push({
            id: entity.id,
            type: "entity",
            title: entity.name,
            description: entity.description,
            category: entity.type,
            url: `/entities/${entity.id}`,
            relevance,
          })
        }
      })
    }

    // Apply additional filters
    let filteredResults = results

    if (filters?.category) {
      filteredResults = filteredResults.filter((result) => result.category === filters.category)
    }

    // Sort by relevance
    return filteredResults.sort((a, b) => b.relevance - a.relevance)
  }

  private static calculateRelevance(searchTerm: string, title: string, description: string, tags: string[]): number {
    let relevance = 0

    // Title match (highest weight)
    if (title.toLowerCase().includes(searchTerm)) {
      relevance += 10
      if (title.toLowerCase().startsWith(searchTerm)) {
        relevance += 5
      }
    }

    // Description match
    if (description.toLowerCase().includes(searchTerm)) {
      relevance += 5
    }

    // Tags match
    tags.forEach((tag) => {
      if (tag.toLowerCase().includes(searchTerm)) {
        relevance += 3
      }
    })

    return relevance
  }

  static getRecentSearches(): string[] {
    if (typeof window === "undefined") return []
    const recent = localStorage.getItem("recentSearches")
    return recent ? JSON.parse(recent) : []
  }

  static addRecentSearch(query: string): void {
    if (typeof window === "undefined") return
    const recent = this.getRecentSearches()
    const updated = [query, ...recent.filter((q) => q !== query)].slice(0, 5)
    localStorage.setItem("recentSearches", JSON.stringify(updated))
  }

  static getSuggestions(query: string): string[] {
    const suggestions: string[] = []
    const searchTerm = query.toLowerCase()

    // Add process names as suggestions
    mockProcesses.forEach((process) => {
      if (process.name.toLowerCase().includes(searchTerm)) {
        suggestions.push(process.name)
      }
    })

    // Add categories as suggestions
    const categories = Array.from(new Set(mockProcesses.map((p) => p.category)))
    categories.forEach((category) => {
      if (category.toLowerCase().includes(searchTerm)) {
        suggestions.push(category)
      }
    })

    return suggestions.slice(0, 5)
  }
}
