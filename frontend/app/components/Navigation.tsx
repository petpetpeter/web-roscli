'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-center items-center h-16">
          <div className="flex space-x-8">
        <Link
          href="/topics"
              className={`px-4 py-2 rounded-md text-lg font-medium transition-colors duration-200 ${
                pathname === '/topics' 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }`}
        >
          Topics
        </Link>
        <Link
          href="/nodes"
              className={`px-4 py-2 rounded-md text-lg font-medium transition-colors duration-200 ${
                pathname === '/nodes' 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }`}
        >
          Nodes
        </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 