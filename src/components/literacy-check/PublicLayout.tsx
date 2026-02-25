import { ReactNode } from 'react';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F5F5F6]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <img
              src="/white_logo.png"
              alt="Logo"
              className="h-10 w-10 object-contain bg-[#0F2147] rounded-lg p-1.5"
            />
            <div>
              <h1 className="text-xl font-bold text-[#0F2147]">AI + Data Literacy Check</h1>
              <p className="text-sm text-[#2B3D66]">Quick assessment for readiness</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="mt-16 py-8 border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>This assessment is private and results are not stored on our servers.</p>
        </div>
      </footer>
    </div>
  );
}
