import { mockProcesses, mockDocuments } from "./data"

export interface AnalyticsData {
  processMetrics: {
    total: number
    active: number
    draft: number
    archived: number
    byCategory: { category: string; count: number }[]
    recentActivity: { date: string; count: number }[]
  }
  documentMetrics: {
    total: number
    totalSize: number
    byType: { type: string; count: number; size: number }[]
    uploadTrend: { date: string; count: number }[]
  }
  userActivity: {
    totalUsers: number
    activeUsers: number
    activityTrend: { date: string; users: number }[]
  }
  performance: {
    avgProcessingTime: number
    completionRate: number
    efficiency: number
    trends: { date: string; efficiency: number }[]
  }
}

export class AnalyticsService {
  static getAnalyticsData(period = "30d"): AnalyticsData {
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90

    // Generate mock analytics data based on existing data
    const processMetrics = {
      total: mockProcesses.length,
      active: mockProcesses.filter((p) => p.status === "active").length,
      draft: mockProcesses.filter((p) => p.status === "draft").length,
      archived: mockProcesses.filter((p) => p.status === "archived").length,
      byCategory: this.getProcessesByCategory(),
      recentActivity: this.generateRecentActivity(days),
    }

    const documentMetrics = {
      total: mockDocuments.length,
      totalSize: mockDocuments.reduce((sum, doc) => sum + doc.size, 0),
      byType: this.getDocumentsByType(),
      uploadTrend: this.generateUploadTrend(days),
    }

    const userActivity = {
      totalUsers: 15,
      activeUsers: 12,
      activityTrend: this.generateUserActivityTrend(days),
    }

    const performance = {
      avgProcessingTime: 2.3,
      completionRate: 94,
      efficiency: 87,
      trends: this.generateEfficiencyTrend(days),
    }

    return {
      processMetrics,
      documentMetrics,
      userActivity,
      performance,
    }
  }

  private static getProcessesByCategory() {
    const categories = mockProcesses.reduce(
      (acc, process) => {
        acc[process.category] = (acc[process.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(categories).map(([category, count]) => ({ category, count }))
  }

  private static getDocumentsByType() {
    const types = mockDocuments.reduce(
      (acc, doc) => {
        if (!acc[doc.type]) {
          acc[doc.type] = { count: 0, size: 0 }
        }
        acc[doc.type].count += 1
        acc[doc.type].size += doc.size
        return acc
      },
      {} as Record<string, { count: number; size: number }>,
    )

    return Object.entries(types).map(([type, data]) => ({ type, ...data }))
  }

  private static generateRecentActivity(days = 30) {
    const data = []
    const today = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const count = Math.floor(Math.random() * 10) + 1
      data.push({
        date: date.toISOString().split("T")[0],
        count,
      })
    }

    return data
  }

  private static generateUploadTrend(days = 30) {
    const data = []
    const today = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const count = Math.floor(Math.random() * 5) + 1
      data.push({
        date: date.toISOString().split("T")[0],
        count,
      })
    }

    return data
  }

  private static generateUserActivityTrend(days = 30) {
    const data = []
    const today = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const users = Math.floor(Math.random() * 8) + 5
      data.push({
        date: date.toISOString().split("T")[0],
        users,
      })
    }

    return data
  }

  private static generateEfficiencyTrend(days = 30) {
    const data = []
    const today = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const efficiency = Math.floor(Math.random() * 20) + 75
      data.push({
        date: date.toISOString().split("T")[0],
        efficiency,
      })
    }

    return data
  }

  static generateReport(
    type: "processes" | "documents" | "activity",
    dateRange: { from: Date; to: Date },
    filters?: any,
  ) {
    // Mock report generation with filters
    const data = this.getAnalyticsData()

    // Apply filters if provided
    const filteredData = data
    if (filters) {
      // Simulate filtering logic
      if (filters.category !== "all") {
        // Filter by category logic would go here
      }
      if (filters.status !== "all") {
        // Filter by status logic would go here
      }
    }

    switch (type) {
      case "processes":
        return {
          title: "Rapport des Processus",
          period: `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`,
          data: filteredData.processMetrics,
          summary: `${filteredData.processMetrics.total} processus au total, dont ${filteredData.processMetrics.active} actifs`,
        }
      case "documents":
        return {
          title: "Rapport des Documents",
          period: `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`,
          data: filteredData.documentMetrics,
          summary: `${filteredData.documentMetrics.total} documents, ${this.formatFileSize(filteredData.documentMetrics.totalSize)} au total`,
        }
      case "activity":
        return {
          title: "Rapport d'Activité",
          period: `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`,
          data: filteredData.userActivity,
          summary: `${filteredData.userActivity.activeUsers}/${filteredData.userActivity.totalUsers} utilisateurs actifs`,
        }
    }
  }

  static exportToCSV(data: any, period: string): string {
    const headers = ["Métrique", "Valeur", "Période", "Type"]
    const rows: string[][] = []

    if (data.total !== undefined) {
      // Process metrics
      rows.push(["Processus Total", data.total.toString(), period, "Processus"])
      rows.push(["Processus Actifs", data.active.toString(), period, "Processus"])
      rows.push(["Brouillons", data.draft.toString(), period, "Processus"])

      if (data.byCategory) {
        data.byCategory.forEach((cat: any) => {
          rows.push([`Catégorie ${cat.category}`, cat.count.toString(), period, "Processus"])
        })
      }
    }

    if (data.totalSize !== undefined) {
      // Document metrics
      rows.push(["Documents Total", data.total.toString(), period, "Documents"])
      rows.push(["Taille Totale", this.formatFileSize(data.totalSize), period, "Documents"])

      if (data.byType) {
        data.byType.forEach((type: any) => {
          rows.push([`Type ${type.type}`, type.count.toString(), period, "Documents"])
        })
      }
    }

    if (data.totalUsers !== undefined) {
      // Activity metrics
      rows.push(["Utilisateurs Total", data.totalUsers.toString(), period, "Activité"])
      rows.push(["Utilisateurs Actifs", data.activeUsers.toString(), period, "Activité"])
      rows.push(["Taux d'Activité", `${Math.round((data.activeUsers / data.totalUsers) * 100)}%`, period, "Activité"])
    }

    return [headers, ...rows].map((row) => row.join(",")).join("\n")
  }

  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }
}
