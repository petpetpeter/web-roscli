'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex space-x-4">
        <Link
          href="/topics"
          className={`px-3 py-2 rounded-md ${
            pathname === '/topics' ? 'bg-gray-900' : 'hover:bg-gray-700'
          }`}
        >
          Topics
        </Link>
        <Link
          href="/nodes"
          className={`px-3 py-2 rounded-md ${
            pathname === '/nodes' ? 'bg-gray-900' : 'hover:bg-gray-700'
          }`}
        >
          Nodes
        </Link>
      </div>
    </nav>
  );
} 