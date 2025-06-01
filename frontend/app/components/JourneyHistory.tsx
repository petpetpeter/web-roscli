'use client';

import React from 'react';
import { useJourneyStore, JourneyItem } from '../store/journeyStore';
import { useRouter } from 'next/navigation';

export default function JourneyHistory() {
  const router = useRouter();
  const { items, clearItems, removeItem } = useJourneyStore();

  const handleItemClick = (item: JourneyItem) => {
    if (item.type === 'node') {
      const fullNodeName = item.namespace === '/' ? item.name : `${item.namespace}/${item.name}`;
      router.push(`/nodes?node=${encodeURIComponent(fullNodeName)}`);
    } else {
      router.push(`/topics?topic=${encodeURIComponent(item.name)}`);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Navigation History</h3>
        {items.length > 0 && (
          <button
            onClick={clearItems}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Clear History
          </button>
        )}
      </div>
      
      {items.length === 0 ? (
        <p className="text-gray-500 text-sm">No navigation history yet</p>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {items.map((item: JourneyItem, index: number) => (
            <div key={index} className="flex items-center justify-between group">
              <button
                onClick={() => handleItemClick(item)}
                className="flex-1 text-left hover:bg-gray-100 px-2 py-1 rounded"
              >
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${
                    item.type === 'topic' ? 'text-blue-600' :
                    item.type === 'node' ? 'text-violet-600' :
                    'text-gray-600'
                  }`}>
                    {item.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(item.timestamp)}
                  </span>
                </div>
              </button>
              <button
                onClick={() => removeItem(index)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 px-2"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 