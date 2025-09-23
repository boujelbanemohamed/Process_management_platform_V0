"use client"

import { useEffect, useState, type FormEvent, type ChangeEvent } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Upload, Loader2 } from "lucide-react"

interface DocumentEditFormProps {
  documentId: string
}

export function DocumentEditForm({ documentId }: DocumentEditFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [doc, setDoc] = useState<any | null>(null)
  const [processes, setProcesses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [pendingVersionName, setPendingVersionName] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    processId: "",
    description: "",
  })

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        // Charger le document
        const resDoc = await fetch(`/api/documents?id=${documentId}`)
        if (!resDoc.ok) throw new Error("Erreur lors du chargement du document")
        const data = await resDoc.json()
        const normalized: any = {
          ...data,
          id: String(data.id),
          name: data.name || "Sans nom",
          uploadedAt: data.uploaded_at ? new Date(data.uploaded_at) : new Date(),
          uploadedBy: String(data.uploaded_by || 1),
          processId: data.process_id ? String(data.process_id) : "",
          version: data.version || "1.0",
          type: data.type || "unknown",
          url: data.url || "#",
        }
        setDoc(normalized)
        setFormData({ name: normalized.name, processId: normalized.processId, description: "" })

        // Charger les processus pour la liste déroulante
        const resProc = await fetch(`/api/processes`)
        if (resProc.ok) {
          const procs = await resProc.json()
          setProcesses(Array.isArray(procs) ? procs : [])
        }
      } catch (e: any) {
        setError(e?.message || "Erreur inconnue")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [documentId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement du document...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Erreur: {error}</p>
        <Button onClick={() => router.refresh()}>Réessayer</Button>
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-500">Document non trouvé</p>
      </div>
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await fetch(`/api/documents`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: documentId,
          name: formData.name,
          description: formData.description,
          processId: formData.processId ? Number(formData.processId) : null,
        }),
      })
      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde du document")
      }
      toast({ title: "Modifications enregistrées", description: "Le document a été mis à jour avec succès." })
      router.push(`/documents/${documentId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setIsLoading(false)
    }
  }

  const triggerFileDialog = () => {
    const el = window.document.getElementById("version-upload") as HTMLInputElement | null
    el?.click()
  }

  const handleFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setIsLoading(true)
      if (file.size > 10 * 1024 * 1024) {
        alert("Fichier trop volumineux (max 10 Mo)")
        return
      }
      const fd = new FormData()
      fd.append("file", file)
      if (formData.processId) fd.append("processId", formData.processId)
      fd.append("description", formData.description)
      fd.append("existingId", documentId)

      const res = await fetch("/api/uploads", { method: "POST", body: fd })
      if (!res.ok) throw new Error("Échec de l'upload de la nouvelle version")
      const data = await res.json().catch(() => null)
      setPendingVersionName(file.name)
      toast({ title: "Nouvelle version prête", description: `${file.name} a été téléversé(e).` })
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur inconnue")
    } finally {
      setIsLoading(false)
      // réinitialiser la valeur pour pouvoir re-sélectionner le même fichier si besoin
      const el = window.document.getElementById("version-upload") as HTMLInputElement | null
      if (el) el.value = ""
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Modifier le document</h1>
          <p className="text-slate-600 mt-1">{doc.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edit Form */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-800">Informations du document</CardTitle>
            <CardDescription>Modifiez les métadonnées du document</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nom du document</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nom du document"
                />
              </div>

              <div>
                <Label htmlFor="processId">Processus associé</Label>
                <select
                  id="processId"
                  value={formData.processId}
                  onChange={(e) => setFormData({ ...formData, processId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <option value="">Sélectionner un processus</option>
                  {processes.map((process) => (
                    <option key={process.id} value={process.id}>
                      {process.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du document..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isLoading} className="bg-slate-800 hover:bg-slate-700">
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? "Enregistrement..." : "Enregistrer"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Version Management */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-800">Gestion des versions</CardTitle>
            <CardDescription>Téléchargez une nouvelle version du document</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="text-sm text-slate-600">
              <p>
                Version actuelle: <span className="font-medium">{doc.version}</span>
              </p>
              <p>Dernière modification: {doc.uploadedAt.toLocaleDateString("fr-FR")}</p>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600 mb-3">Télécharger une nouvelle version</p>
              <Input
                type="file"
                className="hidden"
                id="version-upload"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                onChange={handleFileSelected}
              />
              <Button
                variant="outline"
                className="cursor-pointer bg-transparent"
                disabled={isLoading}
                onClick={triggerFileDialog}
              >
                {isLoading ? "Téléchargement..." : "Sélectionner un fichier"}
              </Button>
              {pendingVersionName && (
                <div className="mt-3 text-left text-sm text-slate-700">
                  Nouvelle version en attente d'enregistrement: <span className="font-medium">{pendingVersionName}</span>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-500">
              <p>• La nouvelle version remplacera la version actuelle</p>
              <p>• L'ancienne version sera conservée dans l'historique</p>
              <p>• Formats acceptés: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
