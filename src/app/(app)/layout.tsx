
import type { ReactNode } from 'react';
import TopNavBar from '@/components/layout/TopNavBar';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNavBar />
      <main className="flex-1 overflow-y-auto p-6 bg-background pt-20"> {/* Added pt-20 for top nav spacing */}
        {children}
      </main>
    </div>
  );
}
