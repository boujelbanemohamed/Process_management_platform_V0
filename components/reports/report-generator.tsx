"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AnalyticsService } from "@/lib/analytics"
import { Download, FileText, Filter, Save, Calendar, BarChart3, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

export function ReportGenerator() {
  const [reportType, setReportType] = useState<"processes" | "documents" | "activity">("processes")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedReport, setGeneratedReport] = useState<any>(null)
  const [filters, setFilters] = useState({
    category: "all",
    status: "all",
    user: "all",
    includeCharts: true,
    includeDetails: true,
  })
  const [savedReports, setSavedReports] = useState<any[]>([])

  useEffect(() => {
    const loadedReports = localStorage.getItem("savedReports")
    if (loadedReports) {
      setSavedReports(JSON.parse(loadedReports))
    }
  }, [])
  const [reportName, setReportName] = useState("")
  const [activeTab, setActiveTab] = useState("generate")

  const handleGenerateReport = async () => {
    if (!dateFrom || !dateTo) return

    const fromDate = new Date(dateFrom)
    const toDate = new Date(dateTo)

    if (fromDate > toDate) {
      alert("La date de début doit être antérieure à la date de fin")
      return
    }

    if (toDate > new Date()) {
      alert("La date de fin ne peut pas être dans le futur")
      return
    }

    setIsGenerating(true)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    const report = AnalyticsService.generateReport(
      reportType,
      {
        from: fromDate,
        to: toDate,
      },
      filters,
    )

    setGeneratedReport(report)
    setIsGenerating(false)
  }

  const handleExportReport = (format: "txt" | "csv" | "pdf" | "json") => {
    if (!generatedReport) return

    let content: string
    let filename: string
    let mimeType: string

    switch (format) {
      case "csv":
        content = AnalyticsService.exportToCSV(generatedReport.data, generatedReport.period)
        filename = `rapport-${reportType}-${new Date().toISOString().split("T")[0]}.csv`
        mimeType = "text/csv"
        break

      case "json":
        content = JSON.stringify(generatedReport, null, 2)
        filename = `rapport-${reportType}-${new Date().toISOString().split("T")[0]}.json`
        mimeType = "application/json"
        break

      case "pdf":
        content = `PDF Report: ${generatedReport.title}\n${generatedReport.summary}`
        filename = `rapport-${reportType}-${new Date().toISOString().split("T")[0]}.pdf`
        mimeType = "application/pdf"
        break

      default: // txt
        content = `
${generatedReport.title}
Période: ${generatedReport.period}

Résumé: ${generatedReport.summary}

Données détaillées:
${JSON.stringify(generatedReport.data, null, 2)}

Généré le: ${new Date().toLocaleString()}
        `.trim()
        filename = `rapport-${reportType}-${new Date().toISOString().split("T")[0]}.txt`
        mimeType = "text/plain"
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSaveReport = () => {
    if (!generatedReport || !reportName) return

    const savedReport = {
      id: Date.now(),
      name: reportName,
      type: reportType,
      dateFrom,
      dateTo,
      filters,
      createdAt: new Date().toISOString(),
      data: generatedReport,
    }

    const updatedReports = [...savedReports, savedReport]
    setSavedReports(updatedReports)
    localStorage.setItem("savedReports", JSON.stringify(updatedReports))
    setReportName("")
    alert("Rapport sauvegardé avec succès!")
  }

  const handleLoadSavedReport = (savedReport: any) => {
    setReportType(savedReport.type)
    setDateFrom(savedReport.dateFrom)
    setDateTo(savedReport.dateTo)
    setFilters(savedReport.filters)
    setGeneratedReport(savedReport.data)
    setActiveTab("generate")
  }

  const handleDeleteReport = (reportId: number) => {
    const updatedReports = savedReports.filter((report) => report.id !== reportId)
    setSavedReports(updatedReports)
    localStorage.setItem("savedReports", JSON.stringify(updatedReports))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Générateur de Rapports</h1>
        <p className="text-slate-600 mt-1">Créez des rapports personnalisés pour analyser vos données</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Générer</TabsTrigger>
          <TabsTrigger value="saved">Rapports Sauvegardés</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Configuration du Rapport
              </CardTitle>
              <CardDescription>Sélectionnez les paramètres de votre rapport</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="report-type">Type de rapport</Label>
                  <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="processes">Rapport des Processus</SelectItem>
                      <SelectItem value="documents">Rapport des Documents</SelectItem>
                      <SelectItem value="activity">Rapport d'Activité</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date-from">Date de début</Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="date-to">Date de fin</Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <Card className="bg-slate-50 border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtres Avancés
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm">Catégorie</Label>
                      <Select
                        value={filters.category}
                        onValueChange={(value) => setFilters({ ...filters, category: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les catégories</SelectItem>
                          <SelectItem value="RH">Ressources Humaines</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="IT">Informatique</SelectItem>
                          <SelectItem value="Operations">Opérations</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Statut</Label>
                      <Select
                        value={filters.status}
                        onValueChange={(value) => setFilters({ ...filters, status: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les statuts</SelectItem>
                          <SelectItem value="active">Actif</SelectItem>
                          <SelectItem value="draft">Brouillon</SelectItem>
                          <SelectItem value="archived">Archivé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Utilisateur</Label>
                      <Select value={filters.user} onValueChange={(value) => setFilters({ ...filters, user: value })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les utilisateurs</SelectItem>
                          <SelectItem value="admin">Administrateurs</SelectItem>
                          <SelectItem value="contributor">Contributeurs</SelectItem>
                          <SelectItem value="reader">Lecteurs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex space-x-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-charts"
                        checked={filters.includeCharts}
                        onCheckedChange={(checked) => setFilters({ ...filters, includeCharts: !!checked })}
                      />
                      <Label htmlFor="include-charts" className="text-sm">
                        Inclure les graphiques
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-details"
                        checked={filters.includeDetails}
                        onCheckedChange={(checked) => setFilters({ ...filters, includeDetails: !!checked })}
                      />
                      <Label htmlFor="include-details" className="text-sm">
                        Inclure les détails
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={handleGenerateReport}
                  disabled={isGenerating || !dateFrom || !dateTo}
                  className="bg-slate-800 hover:bg-slate-700"
                >
                  {isGenerating ? "Génération..." : "Générer le rapport"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {generatedReport && (
            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-slate-800">{generatedReport.title}</CardTitle>
                    <CardDescription>{generatedReport.period}</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={() => handleExportReport("csv")} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      CSV
                    </Button>
                    <Button onClick={() => handleExportReport("json")} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      JSON
                    </Button>
                    <Button onClick={() => handleExportReport("txt")} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      TXT
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h3 className="font-medium text-slate-800 mb-2">Résumé</h3>
                    <p className="text-slate-600">{generatedReport.summary}</p>
                  </div>

                  {filters.includeCharts && (
                    <div className="space-y-4">
                      <h3 className="font-medium text-slate-800 flex items-center">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Visualisations
                      </h3>

                      {reportType === "processes" && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <Card className="p-4">
                            <h4 className="text-sm font-medium mb-3">Activité Récente</h4>
                            <ResponsiveContainer width="100%" height={200}>
                              <LineChart data={generatedReport.data.recentActivity}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" stroke="#475569" />
                              </LineChart>
                            </ResponsiveContainer>
                          </Card>

                          <Card className="p-4">
                            <h4 className="text-sm font-medium mb-3">Par Catégorie</h4>
                            <ResponsiveContainer width="100%" height={200}>
                              <BarChart data={generatedReport.data.byCategory}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="category" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#475569" />
                              </BarChart>
                            </ResponsiveContainer>
                          </Card>
                        </div>
                      )}
                    </div>
                  )}

                  {filters.includeDetails && (
                    <div>
                      <h3 className="font-medium text-slate-800 mb-4">Données détaillées</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {reportType === "processes" && (
                          <>
                            <div className="p-4 border border-slate-200 rounded-lg">
                              <div className="text-2xl font-bold text-slate-800">{generatedReport.data.total}</div>
                              <div className="text-sm text-slate-600">Total des processus</div>
                            </div>
                            <div className="p-4 border border-slate-200 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">{generatedReport.data.active}</div>
                              <div className="text-sm text-slate-600">Processus actifs</div>
                            </div>
                            <div className="p-4 border border-slate-200 rounded-lg">
                              <div className="text-2xl font-bold text-yellow-600">{generatedReport.data.draft}</div>
                              <div className="text-sm text-slate-600">Brouillons</div>
                            </div>
                          </>
                        )}

                        {reportType === "documents" && (
                          <>
                            <div className="p-4 border border-slate-200 rounded-lg">
                              <div className="text-2xl font-bold text-slate-800">{generatedReport.data.total}</div>
                              <div className="text-sm text-slate-600">Total des documents</div>
                            </div>
                            <div className="p-4 border border-slate-200 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">
                                {Math.round(generatedReport.data.totalSize / 1024 / 1024)} MB
                              </div>
                              <div className="text-sm text-slate-600">Taille totale</div>
                            </div>
                            <div className="p-4 border border-slate-200 rounded-lg">
                              <div className="text-2xl font-bold text-purple-600">
                                {generatedReport.data.byType.length}
                              </div>
                              <div className="text-sm text-slate-600">Types de fichiers</div>
                            </div>
                          </>
                        )}

                        {reportType === "activity" && (
                          <>
                            <div className="p-4 border border-slate-200 rounded-lg">
                              <div className="text-2xl font-bold text-slate-800">{generatedReport.data.totalUsers}</div>
                              <div className="text-sm text-slate-600">Utilisateurs totaux</div>
                            </div>
                            <div className="p-4 border border-slate-200 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">
                                {generatedReport.data.activeUsers}
                              </div>
                              <div className="text-sm text-slate-600">Utilisateurs actifs</div>
                            </div>
                            <div className="p-4 border border-slate-200 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">
                                {Math.round((generatedReport.data.activeUsers / generatedReport.data.totalUsers) * 100)}
                                %
                              </div>
                              <div className="text-sm text-slate-600">Taux d'activité</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <Label htmlFor="report-name" className="text-sm">
                            Nom du rapport
                          </Label>
                          <Input
                            id="report-name"
                            placeholder="Entrez un nom pour sauvegarder ce rapport"
                            value={reportName}
                            onChange={(e) => setReportName(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <Button
                          onClick={handleSaveReport}
                          disabled={!reportName}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Sauvegarder
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="saved" className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-800">Rapports Sauvegardés</CardTitle>
              <CardDescription>Accédez à vos rapports précédemment sauvegardés</CardDescription>
            </CardHeader>
            <CardContent>
              {savedReports.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun rapport sauvegardé</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedReports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium text-slate-800">{report.name}</h3>
                        <p className="text-sm text-slate-600">
                          {report.type} • {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={() => handleLoadSavedReport(report)} variant="outline">
                          Charger
                        </Button>
                        <Button
                          onClick={() => handleDeleteReport(report.id)}
                          variant="destructive"
                          size="icon"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-800">Templates de Rapports</CardTitle>
              <CardDescription>Utilisez des templates prédéfinis pour générer rapidement des rapports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-auto p-6 flex flex-col items-start space-y-3 bg-transparent hover:bg-slate-50"
                  onClick={() => {
                    const today = new Date()
                    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
                    setDateFrom(lastWeek.toISOString().split("T")[0])
                    setDateTo(today.toISOString().split("T")[0])
                    setReportType("activity")
                    setFilters({ ...filters, includeCharts: true, includeDetails: true })
                  }}
                >
                  <Calendar className="h-6 w-6 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium">Activité Hebdomadaire</div>
                    <div className="text-sm text-slate-500">
                      Rapport d'activité des 7 derniers jours avec graphiques
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-6 flex flex-col items-start space-y-3 bg-transparent hover:bg-slate-50"
                  onClick={() => {
                    const today = new Date()
                    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
                    setDateFrom(lastMonth.toISOString().split("T")[0])
                    setDateTo(today.toISOString().split("T")[0])
                    setReportType("processes")
                    setFilters({ ...filters, status: "active", includeCharts: true })
                  }}
                >
                  <BarChart3 className="h-6 w-6 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium">Processus Actifs</div>
                    <div className="text-sm text-slate-500">Analyse des processus actifs sur 30 jours</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-6 flex flex-col items-start space-y-3 bg-transparent hover:bg-slate-50"
                  onClick={() => {
                    const today = new Date()
                    const lastQuarter = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
                    setDateFrom(lastQuarter.toISOString().split("T")[0])
                    setDateTo(today.toISOString().split("T")[0])
                    setReportType("documents")
                    setFilters({ ...filters, includeCharts: true, includeDetails: true })
                  }}
                >
                  <FileText className="h-6 w-6 text-purple-600" />
                  <div className="text-left">
                    <div className="font-medium">Rapport Trimestriel</div>
                    <div className="text-sm text-slate-500">Analyse complète des documents sur 3 mois</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-6 flex flex-col items-start space-y-3 bg-transparent hover:bg-slate-50"
                  onClick={() => {
                    const today = new Date()
                    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
                    setDateFrom(yesterday.toISOString().split("T")[0])
                    setDateTo(today.toISOString().split("T")[0])
                    setReportType("activity")
                    setFilters({ ...filters, includeCharts: false, includeDetails: true })
                  }}
                >
                  <Calendar className="h-6 w-6 text-orange-600" />
                  <div className="text-left">
                    <div className="font-medium">Rapport Quotidien</div>
                    <div className="text-sm text-slate-500">Activité des dernières 24 heures</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-6 flex flex-col items-start space-y-3 bg-transparent hover:bg-slate-50"
                  onClick={() => {
                    const today = new Date()
                    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
                    setDateFrom(lastMonth.toISOString().split("T")[0])
                    setDateTo(today.toISOString().split("T")[0])
                    setReportType("processes")
                    setFilters({ ...filters, category: "RH", includeCharts: true })
                  }}
                >
                  <BarChart3 className="h-6 w-6 text-red-600" />
                  <div className="text-left">
                    <div className="font-medium">Rapport RH</div>
                    <div className="text-sm text-slate-500">Processus RH des 30 derniers jours</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-6 flex flex-col items-start space-y-3 bg-transparent hover:bg-slate-50"
                  onClick={() => {
                    const today = new Date()
                    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
                    setDateFrom(lastWeek.toISOString().split("T")[0])
                    setDateTo(today.toISOString().split("T")[0])
                    setReportType("documents")
                    setFilters({ ...filters, includeCharts: true, includeDetails: false })
                  }}
                >
                  <FileText className="h-6 w-6 text-teal-600" />
                  <div className="text-left">
                    <div className="font-medium">Synthèse Documents</div>
                    <div className="text-sm text-slate-500">Vue d'ensemble des documents récents</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
