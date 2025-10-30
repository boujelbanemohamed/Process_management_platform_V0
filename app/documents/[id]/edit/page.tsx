'use client';  // ⬅️ CETTE LIGNE DOIT ÊTRE LA TOUTE PREMIÈRE

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth'; // aledrec : j'ai changé le chemin
import { DocumentEditForm } from '@/components/documents/document-edit-form'; // aledrec : j'importe le formulaire

export default function EditDocumentPage({ params }: { params: { id: string } }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // 🔍 Logs de debug
  useEffect(() => {
    console.log('🟣 Page EditDocument montée');
    console.log('🟣 User:', user);
    console.log('🟣 isLoading:', isLoading);
  }, [user, isLoading]);

  // Attendre le chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Chargement de la session...</div>
      </div>
    );
  }

  // Vérifier l'authentification
  if (!user) {
    console.log('❌ Pas de user après loading, redirection...');
    // Redirige côté client si l'utilisateur n'est pas trouvé après le chargement
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return (
       <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-500 text-lg">Vous n&#39;êtes pas authentifié. Redirection...</p>
      </div>
    );
  }

  // Une fois l'utilisateur authentifié, on affiche le formulaire
  return <DocumentEditForm documentId={params.id} />;
}
