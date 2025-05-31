'use client';

import { useEffect, useState, useMemo } from 'react';
import SearchBar from '../components/SearchBar';
import React from 'react';
import { API_BASE_URL } from '../config';
import { useSearchParams, useRouter } from 'next/navigation';
import NodeGraph from '../components/NodeGraph';

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
  const searchParams = useSearchParams();
  const router = useRouter();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loadingNodes, setLoadingNodes] = useState(true);
  const [errorNodes, setErrorNodes] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodeInfo, setNodeInfo] = useState<NodeInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  const handleTopicClick = (topic: string) => {
    console.log('Navigating to topic:', topic); // Debug log
    router.push(`/topics?topic=${encodeURIComponent(topic)}`);
  };

  // Function to fetch node info
  const fetchNodeInfo = async (node: Node) => {
    console.log('Fetching info for node:', node); // Debug log
    setLoadingInfo(true);
    setErrorInfo(null);
    try {
      const fullNodeName = node.namespace === '/' 
        ? node.name 
        : `${node.namespace}/${node.name}`;
      console.log('Fetching from API:', fullNodeName); // Debug log
      const res = await fetch(
        `${API_BASE_URL}/nodes/${encodeURIComponent(fullNodeName)}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: NodeInfo = await res.json();
      console.log('Received node info:', data); // Debug log
      setNodeInfo(data);
    } catch (err: any) {
      console.error('Error fetching node info:', err); // Debug log
      setErrorInfo(err.message);
    } finally {
      setLoadingInfo(false);
    }
  };

  // Load nodes list and handle URL parameter
  useEffect(() => {
    async function fetchNodes() {
      try {
        const res = await fetch(`${API_BASE_URL}/nodes`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Node[] = await res.json();
        console.log('Fetched nodes:', data); // Debug log
        
        // Add unique id to each node
        const nodesWithIds = data.map((node, index) => ({
          ...node,
          id: `${node.namespace}/${node.name}-${index}`
        }));
        setNodes(nodesWithIds);

        // Handle URL parameter for node selection
        const nodeParam = searchParams.get('node');
        console.log('URL node parameter:', nodeParam); // Debug log
        
        if (nodeParam) {
          const decodedNode = decodeURIComponent(nodeParam);
          console.log('Decoded node:', decodedNode); // Debug log
          
          // Set the search query to the node name
          setSearchQuery(decodedNode);
          
          // Find and select the node
          const [namespace, name] = decodedNode.split('/');
          console.log('Looking for node:', { namespace, name }); // Debug log
          
          const targetNode = nodesWithIds.find(
            node => {
              const matches = node.name === name && node.namespace === (namespace || '/');
              console.log('Checking node:', node, 'matches:', matches); // Debug log
              return matches;
            }
          );
          
          if (targetNode) {
            console.log('Found target node:', targetNode); // Debug log
            setSelectedNode(targetNode);
            fetchNodeInfo(targetNode);
          } else {
            console.log('No matching node found'); // Debug log
          }
        }
      } catch (err: any) {
        console.error('Error fetching nodes:', err); // Debug log
        setErrorNodes(err.message);
      } finally {
        setLoadingNodes(false);
      }
    }
    fetchNodes();
  }, [searchParams]);

  // When search query changes, try to find and select a matching node
  useEffect(() => {
    if (searchQuery && nodes.length > 0) {
      console.log('Search query changed:', searchQuery); // Debug log
      const [namespace, name] = searchQuery.split('/');
      console.log('Looking for node:', { namespace, name }); // Debug log
      
      // First try exact match
      let matchingNode = nodes.find(
        node => {
          const matches = node.name === name && node.namespace === (namespace || '/');
          console.log('Checking exact match for node:', node, 'matches:', matches); // Debug log
          return matches;
        }
      );

      // If no exact match, find first node that contains the search query
      if (!matchingNode) {
        matchingNode = nodes.find(node => {
          const fullNodeName = node.namespace === '/' ? node.name : `${node.namespace}/${node.name}`;
          return fullNodeName.toLowerCase().includes(searchQuery.toLowerCase());
        });
        console.log('Found partial match:', matchingNode); // Debug log
      }
      
      if (matchingNode) {
        console.log('Found matching node:', matchingNode); // Debug log
        setSelectedNode(matchingNode);
        fetchNodeInfo(matchingNode);
      } else {
        console.log('No matching node found for search query'); // Debug log
      }
    }
  }, [searchQuery, nodes]);

  // Filter nodes based on search query
  const filteredNodes = nodes.filter(node => {
    const fullNodeName = node.namespace === '/' 
      ? node.name 
      : `${node.namespace}/${node.name}`;
    return fullNodeName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Select first filtered node when search results change
  useEffect(() => {
    if (filteredNodes.length > 0 && !selectedNode) {
      setSelectedNode(filteredNodes[0]);
      fetchNodeInfo(filteredNodes[0]);
    }
  }, [filteredNodes]);

  // Load node info when a node is selected
  useEffect(() => {
    if (selectedNode) {
      fetchNodeInfo(selectedNode);
    } else {
      setNodeInfo(null);
    }
  }, [selectedNode]);

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
                  {/* Graph section */}
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Node Graph</h3>
                    <NodeGraph nodeInfo={{
                      node_name: nodeInfo.node,
                      node_namespace: nodeInfo.namespace,
                      publishers: nodeInfo.publishes.map(pub => ({
                        topic: pub.topic,
                        topic_type: pub.types.join(', ')
                      })),
                      subscribers: nodeInfo.subscribes.map(sub => ({
                        topic: sub.topic,
                        topic_type: sub.types.join(', ')
                      }))
                    }} />
                  </div>

                  <div className="mb-4 border-t pt-4">
                    <h3 className="font-semibold">Publishes:</h3>
                    {nodeInfo.publishes.length === 0 && <p>None</p>}
                    <ul className="list-disc pl-6">
                      {nodeInfo.publishes.map((pub, i) => (
                        <li key={i}>
                          <button
                            onClick={() => handleTopicClick(pub.topic)}
                            className="text-blue-600 hover:underline"
                          >
                            {pub.topic}
                          </button>{' '}
                          — {pub.types.join(', ')}
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
                          <button
                            onClick={() => handleTopicClick(sub.topic)}
                            className="text-blue-600 hover:underline"
                          >
                            {sub.topic}
                          </button>{' '}
                          — {sub.types.join(', ')}
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