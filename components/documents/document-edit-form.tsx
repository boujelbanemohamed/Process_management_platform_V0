"use client";

import { useEffect, useState, type FormEvent, type ChangeEvent, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { upload } from '@vercel/blob/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";

interface DocumentEditFormProps {
  documentId: string;
}

export function DocumentEditForm({ documentId }: DocumentEditFormProps) {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [doc, setDoc] = useState<any | null>(null);
  const [latestVersion, setLatestVersion] = useState<any | null>(null);
  const [processes, setProcesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [newVersion, setNewVersion] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    processId: "",
    description: "",
  });

  useEffect(() => {
    if (!isAuthLoading && user) {
      const load = async () => {
        try {
          setLoading(true);
          const resDoc = await fetch(`/api/documents?id=${documentId}`);
          if (!resDoc.ok) throw new Error("Erreur lors du chargement du document");
          const data = await resDoc.json();

          setDoc(data);
          if (data.versions && data.versions.length > 0) {
            setLatestVersion(data.versions[0]);
          }

          setFormData({ name: data.name, processId: data.process_id || "", description: data.description || "" });

          const resProc = await fetch(`/api/processes`);
          if (resProc.ok) {
            setProcesses(await resProc.json());
          }
        } catch (e: any) {
          setError(e?.message || "Erreur inconnue");
        } finally {
          setLoading(false);
        }
      };
      load();
    }
  }, [documentId, user, isAuthLoading]);

  const handleFileSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Fichier trop volumineux", { description: "La taille du fichier ne doit pas dépasser 20 Mo." });
      return;
    }
    setPendingFile(file);
  };

  const handleUploadNewVersion = async () => {
    if (!pendingFile) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }
    if (!newVersion) {
      toast.error('Le champ version est obligatoire.');
      return;
    }
    if (!user?.id) {
      toast.error('Erreur d\'authentification');
      return;
    }

    setIsUploading(true);

    try {
      const clientPayload = JSON.stringify({
        userId: user.id,
        version: newVersion,
        existingId: documentId, // Lier à ce document
        fileName: doc.name, // Garder le nom original
        contentType: pendingFile.type,
        fileSize: pendingFile.size,
      });

      await upload(pendingFile.name, pendingFile, {
        access: 'public',
        handleUploadUrl: '/api/uploads',
        clientPayload,
      });

      toast.success("✅ Nouvelle version téléversée avec succès.");
      setPendingFile(null);
      setNewVersion("");
      router.refresh(); // Recharger les données pour voir la nouvelle version

    } catch (error) {
      toast.error("❌ Une erreur est survenue pendant le téléversement.", {
        description: (error as Error).message,
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
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
      });
      if (!response.ok) throw new Error("Erreur lors de la sauvegarde des informations");

      toast.success("Modifications enregistrées");
      router.refresh();

    } catch (err) {
      toast.error("Erreur", { description: (err as Error).message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isAuthLoading || loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /><span className="ml-2">Chargement...</span></div>;
  }
  if (error) {
    return <div className="text-center py-8"><p className="text-red-500 mb-4">Erreur: {error}</p></div>;
  }
  if (!doc) {
    return <div className="text-center py-8"><p>Document non trouvé</p></div>;
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-2" />Retour</Button>
        <h1 className="text-3xl font-bold text-slate-800">Modifier le document</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Informations du document</CardTitle>
            <CardDescription>Modifiez le nom, la description ou le processus associé.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label htmlFor="name">Nom du document</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
              <div>
                <Label htmlFor="processId">Processus associé</Label>
                <select id="processId" value={formData.processId} onChange={(e) => setFormData({ ...formData, processId: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-md text-sm">
                  <option value="">Sélectionner un processus</option>
                  {processes.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
              </div>
              <div><Label htmlFor="description">Description</Label><Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isSaving || isUploading}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Enregistrer</Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Gestion des versions</CardTitle>
            <CardDescription>Téléchargez une nouvelle version du document.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {latestVersion && (
              <div className="text-sm">
                <p>Version actuelle: <span className="font-medium">{latestVersion.version}</span></p>
                <p>Dernière modification: {new Date(latestVersion.uploaded_at).toLocaleDateString("fr-FR")}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="newVersion">Nouvelle Version *</Label>
              <Input
                id="newVersion"
                value={newVersion}
                onChange={(e) => setNewVersion(e.target.value)}
                placeholder="Ex: 1.1, 2024-Q2..."
                disabled={isUploading}
              />
              {!newVersion && pendingFile && <p className="text-red-500 text-xs mt-1">Le champ version est obligatoire.</p>}
            </div>

            {!pendingFile ? (
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-slate-50"
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p>Télécharger une nouvelle version</p>
                <Input ref={fileInputRef} type="file" className="hidden" id="version-upload" onChange={handleFileSelected} disabled={isUploading} />
              </div>
            ) : (
              <div className="border-2 border-dashed border-green-300 bg-green-50 rounded-lg p-6 text-center">
                <p className="font-medium">{pendingFile.name}</p>
                <div className="mt-4 flex justify-center gap-2">
                  <Button onClick={handleUploadNewVersion} disabled={isUploading || !newVersion}>
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Confirmer
                  </Button>
                  <Button variant="ghost" onClick={() => { setPendingFile(null); if(fileInputRef.current) fileInputRef.current.value = ""; }}>Annuler</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
