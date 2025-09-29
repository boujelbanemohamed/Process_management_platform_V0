import { Suspense } from 'react';
import { ModeConfiguration } from '@/components/mode/mode-configuration';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function ModePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configuration du Mode</h1>
          <p className="text-muted-foreground">
            Paramétrez le mode d'affichage de l'application
          </p>
        </div>

        <Suspense fallback={<div>Chargement de la configuration...</div>}>
          <ModeConfiguration />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
