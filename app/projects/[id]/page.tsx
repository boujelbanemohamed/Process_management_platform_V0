import { Suspense } from 'react';
import { ProjectDetail } from '@/components/projects/project-detail';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

interface ProjectPageProps {
  params: {
    id: string;
  };
}

export default function ProjectPage({ params }: ProjectPageProps) {
  return (
    <DashboardLayout>
      <Suspense fallback={<div>Chargement du projet...</div>}>
        <ProjectDetail projectId={params.id} />
      </Suspense>
    </DashboardLayout>
  );
}
