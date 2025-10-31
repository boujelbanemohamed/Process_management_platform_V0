"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Download, Loader2 } from 'lucide-react';
import { DocumentVersionsList } from '@/components/documents/document-versions-list';

export default function DocumentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [documentData, setDocumentData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && user) {
      const fetchDocument = async () => {
        try {
          setLoading(true);
          const response = await fetch(`/api/documents?id=${params.id}`);
          if (!response.ok) {
            throw new Error('Document non trouvé');
          }
          const data = await response.json();
          setDocumentData(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchDocument();
    }
  }, [params.id, user, isAuthLoading]);

  if (isAuthLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Chargement du document...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <Button onClick={() => router.back()} className="mt-4">Retour</Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!documentData) {
    return (
       <DashboardLayout>
        <div className="text-center">
          <p>Aucun document à afficher.</p>
        </div>
      </DashboardLayout>
    );
  }

  const latestVersion = documentData.versions?.[0];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="sm" onClick={() => router.push('/documents')}><ArrowLeft className="h-4 w-4 mr-2" />Retour</Button>
            <div>
              <h1 className="text-3xl font-bold">{documentData.name}</h1>
              <p className="text-slate-500">{documentData.description || 'Pas de description'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/documents/${params.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            {latestVersion && (
              <Button asChild>
                <a href={latestVersion.url} target="_blank" rel="noopener noreferrer" download>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger la v{latestVersion.version}
                </a>
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historique des versions</CardTitle>
            <CardDescription>Consultez et téléchargez les versions précédentes de ce document.</CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentVersionsList versions={documentData.versions} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
