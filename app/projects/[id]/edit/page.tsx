import { Suspense } from 'react';
import { ProjectForm } from '@/components/projects/project-form';

interface EditProjectPageProps {
  params: {
    id: string;
  };
}

export default function EditProjectPage({ params }: EditProjectPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Modifier le Projet</h1>
        <p className="text-muted-foreground">
          Modifiez les informations du projet et son équipe
        </p>
      </div>

      <Suspense fallback={<div>Chargement du projet...</div>}>
        <ProjectForm projectId={params.id} />
      </Suspense>
    </div>
  );
}
