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

  useEffect(() => {
    console.log('🟣 Page EditDocument montée');
    console.log('🟣 User:', user);
    console.log('🟣 isLoading:', isLoading);
  }, [user, isLoading]);

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
    console.log('❌ Pas de user après loading, redirection vers la page d\'accueil...');
    if (typeof window !== 'undefined') {
      // Redirige vers la page d'accueil (qui est la page de connexion)
      router.push('/');
    }
    return (
       <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-red-500 text-lg">Vous n'êtes pas authentifié.</p>
        <Button onClick={() => router.push('/')}>Se connecter</Button>
      </div>
    );
  }

  return <DocumentEditForm documentId={params.id} />;
}
