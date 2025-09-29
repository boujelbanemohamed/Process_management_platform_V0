import { Suspense } from 'react';
import { ProjectDetail } from '@/components/projects/project-detail';

interface ProjectPageProps {
  params: {
    id: string;
  };
}

export default function ProjectPage({ params }: ProjectPageProps) {
  return (
    <Suspense fallback={<div>Chargement du projet...</div>}>
      <ProjectDetail projectId={params.id} />
    </Suspense>
  );
}
