'use client';

import DashboardHeader from '@/presentation/components/features/DashboardHeader';
import DashboardFooter from '@/presentation/components/features/DashboardFooter';

export default function HistoryPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      
      <main className="flex-1">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <h1 className="text-3xl font-bold">Historical Data</h1>
            <p className="text-muted-foreground">
              Historical analytics and reporting will be implemented soon.
            </p>
            <div className="rounded-lg border bg-muted/50 p-8 mt-8">
              <p className="text-sm text-muted-foreground">
                🚧 Coming Soon: Date range picker, historical charts, comparison modes, and export functionality
              </p>
            </div>
          </div>
        </div>
      </main>

      <DashboardFooter />
    </div>
  );
}
