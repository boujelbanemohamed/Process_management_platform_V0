import { Suspense } from 'react';
import { ProjectList } from '@/components/projects/project-list';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function ProjectsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Projets</h1>
            <p className="text-muted-foreground">
              Gérez vos projets et leurs équipes
            </p>
          </div>
          <Link href="/projects/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Projet
            </Button>
          </Link>
        </div>

        <Suspense fallback={<div>Chargement des projets...</div>}>
          <ProjectList />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
