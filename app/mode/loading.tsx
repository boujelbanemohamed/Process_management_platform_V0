import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';

export default function ModeLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="space-y-6">
          {/* Configuration du thème */}
          <div className="border rounded-lg p-6 space-y-4">
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-80" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* Couleurs personnalisées */}
          <div className="border rounded-lg p-6 space-y-4">
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-80" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* Accessibilité */}
          <div className="border rounded-lg p-6 space-y-4">
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-80" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* Actions */}
          <div className="border rounded-lg p-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
