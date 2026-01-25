'use client';

import Image from 'next/image';

export default function DashboardFooter() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="w-full px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Brand Section */}
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Simtestlab Logo"
              width={20}
              height={20}
              className="h-5 w-5"
            />
            <span className="font-semibold text-sm text-gray-900">Simtestlab EMS</span>
            <span className="text-xs text-gray-500 ml-2">Version 2026.1.0</span>
          </div>

          {/* Company Info */}
          <div className="text-xs text-gray-500">
            © {currentYear} Simtestlab Sweden AB. All rights reserved
          </div>
        </div>
      </div>
    </footer>
  );
}
