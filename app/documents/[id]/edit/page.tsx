'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { DocumentEditForm } from '@/components/documents/document-edit-form';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EditDocumentPage({ params }: { params: { id: string } }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center">
          <Loader2 className="h-8 w-8 animate-spin mr-3" />
          <span className="text-lg">Chargement de la session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    // Le DashboardLayout gère déjà la redirection.
    // On affiche simplement un message au cas où ce composant serait rendu en isolation.
    return (
       <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-red-500 text-lg">Vous n'êtes pas authentifié.</p>
        <Button onClick={() => router.push('/')}>Retour à la connexion</Button>
      </div>
    );
  }

  return <DocumentEditForm documentId={params.id} />;
}
