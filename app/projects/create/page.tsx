import { ProjectForm } from '@/components/projects/project-form';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function CreateProjectPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Nouveau Projet</h1>
          <p className="text-muted-foreground">
            Créez un nouveau projet et configurez son équipe
          </p>
        </div>

        <ProjectForm />
      </div>
    </DashboardLayout>
  );
}
