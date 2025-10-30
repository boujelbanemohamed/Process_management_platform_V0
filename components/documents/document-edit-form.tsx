"use client";

import { useEffect, useState, type FormEvent, type ChangeEvent, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { upload } from '@vercel/blob/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Upload, Loader2 } from "lucide-react";

interface DocumentEditFormProps {
  documentId: string;
}

export function DocumentEditForm({ documentId }: DocumentEditFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [doc, setDoc] = useState<any | null>(null);
  const [processes, setProcesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    processId: "",
    description: "",
  });

  useEffect(() => {
    console.log('🟣 Composant EditDocument monté');
    console.log('🟣 User au chargement:', user);
  }, []);

  useEffect(() => {
    console.log('🟣 User a changé:', user);
  }, [user]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const resDoc = await fetch(`/api/documents?id=${documentId}`);
        if (!resDoc.ok) throw new Error("Erreur lors du chargement du document");
        const data = await resDoc.json();
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
          description: data.description || "",
        };
        setDoc(normalized);
        setFormData({ name: normalized.name, processId: normalized.processId, description: normalized.description });

        const resProc = await fetch(`/api/processes`);
        if (resProc.ok) {
          const procs = await resProc.json();
          setProcesses(Array.isArray(procs) ? procs : []);
        }
      } catch (e: any) {
        setError(e?.message || "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [documentId]);

  const handleFileSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('📎 Fichier sélectionné:', file);
    if (!file) {
      setPendingFile(null);
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille du fichier ne doit pas dépasser 20 Mo.",
        variant: "destructive",
      });
      setPendingFile(null);
      return;
    }
    setPendingFile(file);
  };

  const handleUploadNewVersion = async () => {
    console.log('🟢 === DÉBUT handleUploadNewVersion ===');
    console.log('📁 Fichier en attente:', pendingFile);
    console.log('👤 User:', user);
    console.log('👤 User ID:', user?.id);

    if (!pendingFile) {
      console.log('❌ ERREUR: Aucun fichier sélectionné');
      alert('Veuillez sélectionner un fichier');
      return;
    }

    if (!user?.id) {
      console.log('❌ ERREUR: User ID manquant');
      console.log('User complet:', JSON.stringify(user));
      alert('Erreur d\'authentification');
      return;
    }

    console.log('✅ Validations OK - Préparation de l\'upload');
    setIsUploading(true);

    try {
      const clientPayload = JSON.stringify({
        userId: user.id,
        processId: formData.processId,
        description: formData.description,
        existingId: documentId,
        fileName: pendingFile.name,
        contentType: pendingFile.type,
        fileSize: pendingFile.size,
      });

      console.log('📤 Envoi de la requête...');
      const newBlob = await upload(pendingFile.name, pendingFile, {
        access: 'public',
        handleUploadUrl: '/api/uploads',
        clientPayload,
      });
      console.log('📥 Réponse reçue:', newBlob);

      setDoc((prev: any) => ({
        ...prev,
        name: pendingFile.name,
        version: (parseFloat(prev.version || "1.0") + 0.1).toFixed(1),
        type: pendingFile.type,
        size: pendingFile.size,
        url: newBlob.url,
        uploadedAt: new Date(),
      }));
      setFormData(prev => ({ ...prev, name: pendingFile.name }));
      setPendingFile(null);

      console.log('✅ Upload réussi:', newBlob);
      toast({ title: "Nouvelle version téléversée", description: `${pendingFile.name} a été importé(e) avec succès.` });
      router.refresh();

    } catch (error) {
      console.error('❌ ERREUR lors de l\'upload:', error);
      setPendingFile(null);
      toast({
        title: "Échec de l'upload",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
    console.log('🟢 === FIN handleUploadNewVersion ===');
  };

  if (loading || isAuthLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /><span className="ml-2">Chargement...</span></div>;
  }
  if (error) {
    return <div className="text-center py-8"><p className="text-red-500 mb-4">Erreur: {error}</p><Button onClick={() => router.refresh()}>Réessayer</Button></div>;
  }
  if (!doc) {
    return <div className="text-center py-8"><p className="text-slate-500">Document non trouvé</p></div>;
  }

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
      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde du document");
      }
      toast({ title: "Modifications enregistrées", description: "Le document a été mis à jour." });
      router.push(`/documents/${documentId}`);
      router.refresh();
    } catch (err) {
      toast({ title: "Erreur", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-2" />Retour</Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Modifier le document</h1>
          <p className="text-slate-600 mt-1">{doc.name}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-800">Informations du document</CardTitle>
            <CardDescription>Modifiez les métadonnées du document</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label htmlFor="name">Nom du document</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
              <div>
                <Label htmlFor="processId">Processus associé</Label>
                <select id="processId" value={formData.processId} onChange={(e) => setFormData({ ...formData, processId: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-md text-sm">
                  <option value="">Sélectionner un processus</option>
                  {processes.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
              </div>
              <div><Label htmlFor="description">Description</Label><Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isSaving || isUploading} className="bg-slate-800 hover:bg-slate-700">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSaving ? "Enregistrement..." : "Enregistrer"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>Annuler</Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-800">Gestion des versions</CardTitle>
            <CardDescription>Téléchargez une nouvelle version du document</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-slate-600">
              <p>Version actuelle: <span className="font-medium">{doc.version}</span></p>
              <p>Dernière modification: {doc.uploadedAt.toLocaleDateString("fr-FR")}</p>
            </div>

            {!pendingFile ? (
              <div
                className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => !isUploading && !isSaving && fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <Label htmlFor="version-upload" className="text-sm text-slate-600 mb-3 cursor-pointer">
                  Télécharger une nouvelle version
                </Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  id="version-upload"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  onChange={handleFileSelected}
                  disabled={isUploading || isSaving}
                />
              </div>
            ) : (
              <div className="border-2 border-dashed border-green-300 bg-green-50 rounded-lg p-6 text-center">
                <p className="text-sm text-green-700 mb-3">Fichier sélectionné :</p>
                <p className="font-medium text-green-800">{pendingFile.name}</p>
                <div className="mt-4 flex justify-center gap-2">
                  <Button
                    type="button"
                    onClick={handleUploadNewVersion}
                    disabled={isUploading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isUploading ? "Téléversement..." : "Confirmer"}
                  </Button>
                  <Button variant="ghost" onClick={() => setPendingFile(null)}>Annuler</Button>
                </div>
              </div>
            )}

            <div className="text-xs text-slate-500">
              <p>• La nouvelle version remplacera la version actuelle.</p>
              <p>• L'ancienne version sera conservée dans l'historique.</p>
              <p>• Formats acceptés: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG.</p>
              <p>• Taille maximale du fichier : 20 Mo.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
