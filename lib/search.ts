// Service de recherche qui utilise les APIs réelles

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
  static async search(
    query: string,
    filters?: {
      type?: string[]
      category?: string
      dateFrom?: Date
      dateTo?: Date
    },
  ): Promise<SearchResult[]> {
    if (!query.trim()) return []

    const results: SearchResult[] = []
    const searchTerm = query.toLowerCase()

    try {
      // Search in processes
      if (!filters?.type || filters.type.includes("process")) {
        const processesResponse = await fetch("/api/processes")
        if (processesResponse.ok) {
          const processes = await processesResponse.json()
          processes.forEach((process: any) => {
            const relevance = this.calculateRelevance(searchTerm, process.name, process.description, process.tags || [])
            if (relevance > 0) {
              results.push({
                id: String(process.id),
                type: "process",
                title: process.name,
                description: process.description,
                category: process.category,
                tags: process.tags || [],
                url: `/processes/${process.id}`,
                relevance,
              })
            }
          })
        }
      }

      // Search in documents
      if (!filters?.type || filters.type.includes("document")) {
        const documentsResponse = await fetch("/api/documents")
        if (documentsResponse.ok) {
          const documents = await documentsResponse.json()
          documents.forEach((document: any) => {
            const relevance = this.calculateRelevance(searchTerm, document.name, document.description || "", [])
            if (relevance > 0) {
              results.push({
                id: String(document.id),
                type: "document",
                title: document.name,
                description: `Document ${document.type?.toUpperCase() || 'UNKNOWN'} - ${document.description || "Aucune description"}`,
                category: document.type,
                url: `/documents/${document.id}`,
                relevance,
              })
            }
          })
        }
      }

      // Search in entities
      if (!filters?.type || filters.type.includes("entity")) {
        const entitiesResponse = await fetch("/api/entities")
        if (entitiesResponse.ok) {
          const entities = await entitiesResponse.json()
          entities.forEach((entity: any) => {
            const relevance = this.calculateRelevance(searchTerm, entity.name, entity.description || "", [])
            if (relevance > 0) {
              results.push({
                id: String(entity.id),
                type: "entity",
                title: entity.name,
                description: entity.description || "Aucune description",
                category: entity.type,
                url: `/entities/${entity.id}`,
                relevance,
              })
            }
          })
        }
      }

      // Apply additional filters
      let filteredResults = results

      if (filters?.category) {
        filteredResults = filteredResults.filter((result) => result.category === filters.category)
      }

      // Sort by relevance
      return filteredResults.sort((a, b) => b.relevance - a.relevance)
    } catch (error) {
      console.error("Erreur lors de la recherche:", error)
      return []
    }
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

  static async getSuggestions(query: string): Promise<string[]> {
    const suggestions: string[] = []
    const searchTerm = query.toLowerCase()

    try {
      // Add process names as suggestions
      const processesResponse = await fetch("/api/processes")
      if (processesResponse.ok) {
        const processes = await processesResponse.json()
        processes.forEach((process: any) => {
          if (process.name.toLowerCase().includes(searchTerm)) {
            suggestions.push(process.name)
          }
        })

        // Add categories as suggestions
        const categories = Array.from(new Set(processes.map((p: any) => p.category).filter(Boolean)))
        categories.forEach((category: string) => {
          if (category.toLowerCase().includes(searchTerm)) {
            suggestions.push(category)
          }
        })
      }

      // Add entity names as suggestions
      const entitiesResponse = await fetch("/api/entities")
      if (entitiesResponse.ok) {
        const entities = await entitiesResponse.json()
        entities.forEach((entity: any) => {
          if (entity.name.toLowerCase().includes(searchTerm)) {
            suggestions.push(entity.name)
          }
        })
      }

      return suggestions.slice(0, 5)
    } catch (error) {
      console.error("Erreur lors de la récupération des suggestions:", error)
      return []
    }
  }
}
