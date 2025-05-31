'use client';

import { useEffect, useState } from 'react';
import SearchBar from '../components/SearchBar';
import React from 'react';
import { API_BASE_URL } from '../config';

type Node = {
  name: string;
  namespace: string;
  id?: string;  // Add optional id field
};

type NodeInfo = {
  node: string;
  namespace: string;
  publishes: {
    topic: string;
    types: string[];
  }[];
  subscribes: {
    topic: string;
    types: string[];
  }[];
  services: {
    service: string;
    types: string[];
  }[];
  clients: {
    service: string;
    types: string[];
  }[];
};

export default function NodesPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loadingNodes, setLoadingNodes] = useState(true);
  const [errorNodes, setErrorNodes] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodeInfo, setNodeInfo] = useState<NodeInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  // Load nodes list
  useEffect(() => {
    async function fetchNodes() {
      try {
        const res = await fetch(`${API_BASE_URL}/nodes`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Node[] = await res.json();
        // Add unique id to each node
        const nodesWithIds = data.map((node, index) => ({
          ...node,
          id: `${node.namespace}/${node.name}-${index}`
        }));
        console.log('Nodes with IDs:', nodesWithIds);
        setNodes(nodesWithIds);
      } catch (err: any) {
        setErrorNodes(err.message);
      } finally {
        setLoadingNodes(false);
      }
    }
    fetchNodes();
  }, []);

  // Load node info when a node is selected
  useEffect(() => {
    if (!selectedNode) {
      setNodeInfo(null);
      return;
    }
    async function fetchNodeInfo() {
      setLoadingInfo(true);
      setErrorInfo(null);
      try {
        if (!selectedNode) return;
        // Use the full node name (namespace + name) for the API call
        const fullNodeName = selectedNode.namespace === '/' 
          ? selectedNode.name 
          : `${selectedNode.namespace}/${selectedNode.name}`;
        const res = await fetch(
          `${API_BASE_URL}/nodes/${encodeURIComponent(fullNodeName)}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: NodeInfo = await res.json();
        setNodeInfo(data);
      } catch (err: any) {
        setErrorInfo(err.message);
      } finally {
        setLoadingInfo(false);
      }
    }
    fetchNodeInfo();
  }, [selectedNode]);

  // Filter nodes based on search query
  const filteredNodes = nodes.filter(node => {
    const fullNodeName = node.namespace === '/' 
      ? node.name 
      : `${node.namespace}/${node.name}`;
    return fullNodeName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Generate a unique key for each node
  const getNodeKey = (node: Node) => {
    return node.id || `${node.namespace}/${node.name}`;
  };

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">ROS 2 Nodes</h1>

      <div className="flex gap-8">
        {/* Left side - Nodes list */}
        <div className="w-1/3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search nodes or namespaces..."
          />

          {/* Nodes list */}
          {loadingNodes && <p>Loading nodes...</p>}
          {errorNodes && <p className="text-red-500">Error: {errorNodes}</p>}
          {!loadingNodes && !errorNodes && (
            <>
              {filteredNodes.length === 0 ? (
                <p className="text-gray-500">No nodes found matching your search.</p>
              ) : (
                <ul className="list-disc pl-6 mt-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {filteredNodes.map((node) => (
                    <li key={getNodeKey(node)}>
                      <button
                        onClick={() => setSelectedNode(node)}
                        className={`text-blue-600 hover:underline ${
                          selectedNode?.name === node.name && selectedNode?.namespace === node.namespace ? 'font-bold' : ''
                        }`}
                      >
                        {node.name}
                      </button>{' '}
                      <span className="text-gray-500">({node.namespace})</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        {/* Right side - Selected node info */}
        <div className="w-2/3">
          {selectedNode && (
            <section className="border p-4 rounded-md shadow">
              <h2 className="text-xl font-semibold mb-4">
                Node Info: {selectedNode.name}
                <span className="text-gray-500 ml-2">({selectedNode.namespace})</span>
              </h2>

              {loadingInfo && <p>Loading info...</p>}
              {errorInfo && <p className="text-red-500">Error: {errorInfo}</p>}

              {nodeInfo && (
                <>
                  <div className="mb-4">
                    <h3 className="font-semibold">Publishes:</h3>
                    {nodeInfo.publishes.length === 0 && <p>None</p>}
                    <ul className="list-disc pl-6">
                      {nodeInfo.publishes.map((pub, i) => (
                        <li key={i}>
                          {pub.topic} — {pub.types.join(', ')}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-semibold">Subscribes:</h3>
                    {nodeInfo.subscribes.length === 0 && <p>None</p>}
                    <ul className="list-disc pl-6">
                      {nodeInfo.subscribes.map((sub, i) => (
                        <li key={i}>
                          {sub.topic} — {sub.types.join(', ')}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-semibold">Services:</h3>
                    {nodeInfo.services.length === 0 && <p>None</p>}
                    <ul className="list-disc pl-6">
                      {nodeInfo.services.map((srv, i) => (
                        <li key={i}>
                          {srv.service} — {srv.types.join(', ')}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold">Clients:</h3>
                    {nodeInfo.clients.length === 0 && <p>None</p>}
                    <ul className="list-disc pl-6">
                      {nodeInfo.clients.map((clt, i) => (
                        <li key={i}>
                          {clt.service} — {clt.types.join(', ')}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  );
} 