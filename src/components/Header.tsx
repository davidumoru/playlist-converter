import React from 'react';
import { Music2 } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-center space-x-3">
          <Music2 className="w-8 h-8 text-indigo-600" />
          <h1 className="text-xl font-bold text-gray-900">
            Tune Bridge
          </h1>
        </div>
      </div>
    </header>
  );
}
