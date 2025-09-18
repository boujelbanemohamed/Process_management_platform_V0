"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import type { Entity } from "@/types"
import { processes } from "@/lib/data"

interface EntityFormProps {
  entity?: Entity
}

export function EntityForm({ entity }: EntityFormProps) {
  const router = useRouter()
  const isEditing = !!entity

  const [formData, setFormData] = useState({
    name: entity?.name || "",
    type: entity?.type || "department",
    description: entity?.description || "",
    processes: entity?.processes || [],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Here you would typically save to your backend
    console.log("[v0] Saving entity:", formData)

    // Simulate save and redirect
    setTimeout(() => {
      if (isEditing) {
        router.push(`/entities/${entity.id}`)
      } else {
        router.push("/entities")
      }
    }, 1000)
  }

  const handleProcessToggle = (processId: string) => {
    setFormData((prev) => ({
      ...prev,
      processes: prev.processes.includes(processId)
        ? prev.processes.filter((id) => id !== processId)
        : [...prev.processes, processId],
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={isEditing ? `/entities/${entity.id}` : "/entities"}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{isEditing ? "Modifier l'entité" : "Nouvelle entité"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
                <CardDescription>Définissez les informations de base de l'entité</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de l'entité</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Département Marketing"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type d'entité</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="department">Département</SelectItem>
                      <SelectItem value="team">Équipe</SelectItem>
                      <SelectItem value="project">Projet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Décrivez le rôle et les responsabilités de cette entité..."
                    rows={4}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Processus associés</CardTitle>
                <CardDescription>Sélectionnez les processus liés à cette entité</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {processes.map((process) => (
                    <div key={process.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`process-${process.id}`}
                        checked={formData.processes.includes(process.id)}
                        onChange={() => handleProcessToggle(process.id)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`process-${process.id}`} className="flex-1">
                        <div>
                          <p className="font-medium">{process.name}</p>
                          <p className="text-sm text-muted-foreground">{process.description}</p>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button type="submit" className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? "Mettre à jour" : "Créer l'entité"}
                </Button>
                <Button type="button" variant="outline" className="w-full bg-transparent" asChild>
                  <Link href={isEditing ? `/entities/${entity.id}` : "/entities"}>Annuler</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aide</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong>Département :</strong> Unité organisationnelle principale
                </p>
                <p>
                  <strong>Équipe :</strong> Groupe de travail spécialisé
                </p>
                <p>
                  <strong>Projet :</strong> Initiative temporaire avec objectifs définis
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
