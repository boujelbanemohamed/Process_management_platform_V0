"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, X, FileText, ArrowLeft } from "lucide-react"

interface UploadFile {
  id: string
  file: File
  processId: string
  description: string
}

export function DocumentUpload() {
  const router = useRouter()
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [processes, setProcesses] = useState<Array<{ id: number | string; name: string }>>([])
  const [loadingProcesses, setLoadingProcesses] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const fetchProcesses = async () => {
      try {
        setLoadingProcesses(true)
        const res = await fetch("/api/processes")
        if (!res.ok) throw new Error("Erreur lors du chargement des processus")
        const data = await res.json()
        const list = Array.isArray(data) ? data : []
        setProcesses(list.map((p: any) => ({ id: p.id, name: p.name })))
      } catch (e) {
        console.error("Erreur chargement processus:", e)
        setProcesses([])
      } finally {
        setLoadingProcesses(false)
      }
    }
    fetchProcesses()
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    const newFiles = selectedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      processId: "",
      description: "",
    }))
    setFiles((prev) => [...prev, ...newFiles])
  }

  const removeFile = (id: string) => {
    setFiles(files.filter((f) => f.id !== id))
  }

  const updateFile = (id: string, updates: Partial<UploadFile>) => {
    setFiles(files.map((f) => (f.id === id ? { ...f, ...updates } : f)))
  }

  const handleClickSelectFiles = () => {
    fileInputRef.current?.click()
  }

  const handleUpload = async () => {
    setIsUploading(true)
    // TODO: remplacer par appel réel à l'API d'upload
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsUploading(false)
    setFiles([])
    router.push("/documents")
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Importer des documents</h1>
          <p className="text-slate-600 mt-1">Ajoutez de nouveaux documents à vos processus</p>
        </div>
      </div>

      {/* File Selection */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-800">Sélection des fichiers</CardTitle>
          <CardDescription>Choisissez les fichiers à importer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">Glissez-déposez vos fichiers ici ou cliquez pour sélectionner</p>
            <Input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            />
            <Button variant="outline" className="cursor-pointer bg-transparent" onClick={handleClickSelectFiles}>
              Sélectionner des fichiers
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-800">Fichiers sélectionnés</CardTitle>
            <CardDescription>Configurez les détails de chaque fichier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((uploadFile) => (
                <div key={uploadFile.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="font-medium text-slate-800">{uploadFile.file.name}</p>
                        <p className="text-sm text-slate-500">
                          {formatFileSize(uploadFile.file.size)} • {uploadFile.file.type}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(uploadFile.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`process-${uploadFile.id}`}>Processus associé</Label>
                      <select
                        id={`process-${uploadFile.id}`}
                        value={uploadFile.processId}
                        onChange={(e) => updateFile(uploadFile.id, { processId: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                      >
                        <option value="">Sélectionner un processus</option>
                        {processes.map((process) => (
                          <option key={process.id} value={String(process.id)}>
                            {process.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor={`description-${uploadFile.id}`}>Description</Label>
                      <Textarea
                        id={`description-${uploadFile.id}`}
                        value={uploadFile.description}
                        onChange={(e) => updateFile(uploadFile.id, { description: e.target.value })}
                        placeholder="Description du document..."
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <Button variant="outline" onClick={() => router.back()}>
                Annuler
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isUploading || files.some((f) => !f.processId)}
                className="bg-slate-800 hover:bg-slate-700"
              >
                {isUploading ? "Import en cours..." : `Importer ${files.length} fichier(s)`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
