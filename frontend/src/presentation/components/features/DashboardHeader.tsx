'use client';

import Image from 'next/image';

export default function DashboardHeader() {
  return (
    <header className="border-b border-gray-200 bg-white shadow-sm sticky top-0 z-50">
      <div className="w-full px-6 py-3">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Simtestlab Logo"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <div>
            <h1 className="text-lg font-bold text-gray-900">Simtestlab EMS</h1>
            <p className="text-xs text-gray-600">Energy Management System</p>
          </div>
        </div>
      </div>
    </header>
  );
}
