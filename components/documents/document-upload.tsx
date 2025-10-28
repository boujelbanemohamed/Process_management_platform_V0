"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, X, FileText, ArrowLeft } from "lucide-react"

interface UploadFile {
  id: string
  file: File
  linkType: 'process' | 'project'
  processId: string
  projectId: string
  description: string
}

export function DocumentUpload() {
  const router = useRouter()
  const { user } = useAuth()
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [processes, setProcesses] = useState<Array<{ id: number | string; name: string }>>([])
  const [projects, setProjects] = useState<Array<{ id: number | string; name: string }>>([])
  const [loadingProcesses, setLoadingProcesses] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const fetchSelectData = async () => {
      setLoadingProcesses(true)
      setLoadingProjects(true)
      try {
        const [processesRes, projectsRes] = await Promise.all([
          fetch("/api/processes"),
          fetch("/api/projects"),
        ]);
        if (processesRes.ok) {
          const data = await processesRes.json()
          setProcesses(Array.isArray(data) ? data.map((p: any) => ({ id: p.id, name: p.name })) : [])
        }
        if (projectsRes.ok) {
          const data = await projectsRes.json()
          setProjects(Array.isArray(data) ? data.map((p: any) => ({ id: p.id, name: p.name })) : [])
        }
      } catch (e) {
        console.error("Erreur chargement données:", e)
      } finally {
        setLoadingProcesses(false)
        setLoadingProjects(false)
      }
    }
    fetchSelectData()
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      linkType: 'process' as 'process' | 'project',
      processId: "",
      projectId: "",
      description: "",
    }))
    setFiles(prev => [...prev, ...newFiles])
  }

  const handleUpload = async () => {
    if (files.length === 0 || !user) return
    setIsUploading(true)
    try {
      await Promise.all(files.map(f => {
        const fd = new FormData()
        fd.append('file', f.file)
        fd.append('linkType', f.linkType)
        fd.append('processId', f.processId)
        fd.append('projectId', f.projectId)
        fd.append('description', f.description)
        fd.append('userId', user.id)
        return fetch('/api/uploads', { method: 'POST', body: fd }).then(res => {
          if (!res.ok) throw new Error('Échec de téléversement')
        })
      }))
      setFiles([])
      router.push('/documents')
    } catch (e) {
      console.error('Erreur upload:', e)
      alert("Erreur lors de l'import des documents. Veuillez réessayer.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-2" />Retour</Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Importer des documents</h1>
          <p className="text-slate-600 mt-1">Ajoutez de nouveaux documents à vos processus ou projets</p>
        </div>
      </div>
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-800">Sélection des fichiers</CardTitle>
          <CardDescription>Choisissez les fichiers à importer (max 20 Mo)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">Glissez-déposez vos fichiers ou cliquez pour sélectionner</p>
            <Input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden" id="file-upload" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" />
            <Button variant="outline" className="cursor-pointer bg-transparent" onClick={() => fileInputRef.current?.click()}>Sélectionner des fichiers</Button>
          </div>
        </CardContent>
      </Card>
      {files.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-800">Fichiers sélectionnés</CardTitle>
            <CardDescription>Configurez les détails de chaque fichier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map(f => (
                <div key={f.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="font-medium text-slate-800">{f.file.name}</p>
                        <p className="text-sm text-slate-500">{`${(f.file.size / 1024 / 1024).toFixed(2)} Mo`}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setFiles(files.filter(file => file.id !== f.id))} className="text-red-500 hover:text-red-700"><X className="h-4 w-4" /></Button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Type de liaison</Label>
                        <select value={f.linkType} onChange={e => setFiles(files.map(file => file.id === f.id ? { ...file, linkType: e.target.value as any, processId: '', projectId: '' } : file))} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-md text-sm">
                          <option value="process">Processus</option>
                          <option value="project">Projet</option>
                        </select>
                      </div>
                      {f.linkType === 'process' ? (
                        <div>
                          <Label>Processus associé</Label>
                          <select value={f.processId} onChange={e => setFiles(files.map(file => file.id === f.id ? { ...file, processId: e.target.value } : file))} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-md text-sm" disabled={loadingProcesses}>
                            <option value="">{loadingProcesses ? "Chargement..." : "Sélectionner"}</option>
                            {processes.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                          </select>
                        </div>
                      ) : (
                        <div>
                          <Label>Projet associé</Label>
                          <select value={f.projectId} onChange={e => setFiles(files.map(file => file.id === f.id ? { ...file, projectId: e.target.value } : file))} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-md text-sm" disabled={loadingProjects}>
                            <option value="">{loadingProjects ? "Chargement..." : "Sélectionner"}</option>
                            {projects.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea value={f.description} onChange={e => setFiles(files.map(file => file.id === f.id ? { ...file, description: e.target.value } : file))} placeholder="Description du document..." className="mt-1" rows={2} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <Button variant="outline" onClick={() => router.back()}>Annuler</Button>
              <Button onClick={handleUpload} disabled={isUploading || files.some(f => (f.linkType === 'process' && !f.processId) || (f.linkType === 'project' && !f.projectId))} className="bg-slate-800 hover:bg-slate-700">
                {isUploading ? "Import en cours..." : `Importer ${files.length} fichier(s)`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
