'use client';

import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-8">ROS 2 CLI UI</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        <Link 
          href="/topics"
          className="p-6 border rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">Topics</h2>
          <p className="text-gray-600">
            View and inspect ROS 2 topics, their publishers, and subscribers.
          </p>
        </Link>

        <Link 
          href="/nodes"
          className="p-6 border rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">Nodes</h2>
          <p className="text-gray-600">
            Explore ROS 2 nodes, their topics, services, and clients.
          </p>
        </Link>
      </div>
    </main>
  );
}