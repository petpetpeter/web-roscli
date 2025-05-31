'use client';

import { useEffect, useState, useMemo } from 'react';
import SearchBar from '../components/SearchBar';
import React from 'react';
import { API_BASE_URL } from '../config';
import { useRouter, useSearchParams } from 'next/navigation';
import { Topic, TopicInfo } from '../types';
import ROSGraph from '../components/TopicGraph';

export default function TopicsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [errorTopics, setErrorTopics] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [topicInfo, setTopicInfo] = useState<TopicInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  // Load topics list and handle URL parameter
  useEffect(() => {
    async function fetchTopics() {
      try {
        const res = await fetch(`${API_BASE_URL}/topics`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Topic[] = await res.json();
        setTopics(data);

        // Handle URL parameter for topic selection
        const topicParam = searchParams.get('topic');
        if (topicParam) {
          const decodedTopic = decodeURIComponent(topicParam);
          console.log('URL topic parameter:', decodedTopic); // Debug log
          
          // Set the search query to the topic name
          setSearchQuery(decodedTopic);
          
          // Find and select the topic
          const targetTopic = data.find(topic => topic.name === decodedTopic);
          if (targetTopic) {
            console.log('Found target topic:', targetTopic); // Debug log
            setSelectedTopic(targetTopic.encoded_name);
          }
        }
      } catch (err: any) {
        setErrorTopics(err.message);
      } finally {
        setLoadingTopics(false);
      }
    }
    fetchTopics();
  }, [searchParams]);

  // When search query changes, try to find and select a matching topic
  useEffect(() => {
    if (searchQuery && topics.length > 0) {
      console.log('Search query changed:', searchQuery); // Debug log
      
      // First try exact match
      let matchingTopic = topics.find(topic => topic.name === searchQuery);
      
      // If no exact match, find first topic that contains the search query
      if (!matchingTopic) {
        matchingTopic = topics.find(topic => 
          topic.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      if (matchingTopic) {
        console.log('Found matching topic:', matchingTopic); // Debug log
        setSelectedTopic(matchingTopic.encoded_name);
      }
    }
  }, [searchQuery, topics]);

  // Load topic info when a topic is selected
  useEffect(() => {
    if (!selectedTopic) {
      setTopicInfo(null);
      return;
    }
    async function fetchTopicInfo() {
      if (!selectedTopic) return;  // Early return if selectedTopic is null
      setLoadingInfo(true);
      setErrorInfo(null);
      try {
        // The selectedTopic is already encoded from the backend, so we need to decode it first
        const decodedTopic = decodeURIComponent(selectedTopic);
        // Then encode it again for the URL
        const encodedTopic = encodeURIComponent(decodedTopic);
        const res = await fetch(
          `${API_BASE_URL}/topics/${encodedTopic}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: TopicInfo = await res.json();
        setTopicInfo(data);
      } catch (err: any) {
        setErrorInfo(err.message);
      } finally {
        setLoadingInfo(false);
      }
    }
    fetchTopicInfo();
  }, [selectedTopic]);

  // Filter topics based on search query
  const filteredTopics = topics.filter(topic => 
    topic.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNodeClick = (nodeName: string, nodeNamespace: string) => {
    // Ensure we have the correct format: namespace/name
    const fullNodeName = nodeNamespace === '/' ? nodeName : `${nodeNamespace}/${nodeName}`;
    console.log('Navigating to node:', fullNodeName); // Debug log
    router.push(`/nodes?node=${encodeURIComponent(fullNodeName)}`);
  };

  // Prepare graph data
  const graphData = useMemo(() => {
    if (!topicInfo) return { nodes: [], links: [] };

    const nodes = [
      {
        id: topicInfo.topic,
        name: topicInfo.topic,
        type: 'topic' as const,
      },
    ];

    const links = [];

    // Add publishers
    topicInfo.publishers.forEach((pub) => {
      const nodeId = `${pub.node_namespace}/${pub.node_name}`;
      nodes.push({
        id: nodeId,
        name: pub.node_name,
        type: 'publisher' as const,
        namespace: pub.node_namespace,
      });
      links.push({
        source: nodeId,
        target: topicInfo.topic,
        type: 'publishes' as const,
      });
    });

    // Add subscribers
    topicInfo.subscribers.forEach((sub) => {
      const nodeId = `${sub.node_namespace}/${sub.node_name}`;
      nodes.push({
        id: nodeId,
        name: sub.node_name,
        type: 'subscriber' as const,
        namespace: sub.node_namespace,
      });
      links.push({
        source: topicInfo.topic,
        target: nodeId,
        type: 'subscribes' as const,
      });
    });

    return { nodes, links };
  }, [topicInfo]);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">ROS 2 Topics</h1>

      <div className="flex gap-8">
        {/* Left side - Topics list */}
        <div className="w-1/3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search topics..."
          />

          {/* Topics list */}
          {loadingTopics && <p>Loading topics...</p>}
          {errorTopics && <p className="text-red-500">Error: {errorTopics}</p>}
          {!loadingTopics && !errorTopics && (
            <>
              {filteredTopics.length === 0 ? (
                <p className="text-gray-500">No topics found matching your search.</p>
              ) : (
                <ul className="list-disc pl-6 mt-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {filteredTopics.map((topic) => (
                    <li key={topic.encoded_name}>
                      <button
                        onClick={() => setSelectedTopic(topic.encoded_name)}
                        className={`text-blue-600 hover:underline ${
                          selectedTopic === topic.encoded_name ? 'font-bold' : ''
                        }`}
                      >
                        {topic.name}
                      </button>
                      <span className="text-gray-500 ml-2">
                        ({topic.types.join(', ')})
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        {/* Right side - Selected topic info */}
        <div className="w-2/3">
          {selectedTopic && (
            <section className="border p-4 rounded-md shadow">
              <h2 className="text-xl font-semibold mb-4">
                Topic Info: {topicInfo?.topic || decodeURIComponent(selectedTopic).replace(/^\/+/, '/')}
              </h2>

              {loadingInfo && <p>Loading info...</p>}
              {errorInfo && <p className="text-red-500">Error: {errorInfo}</p>}

              {topicInfo && (
                <>
                  {/* Info section with graph and text side by side */}
                  <div className="flex gap-6 mb-6">
                    {/* Graph section */}
                    <div className="w-1/2 min-w-[400px]">
                      <h3 className="font-semibold mb-2">Topic Graph</h3>
                      <ROSGraph data={graphData} />
                    </div>

                    {/* Text content section */}
                    <div className="w-1/2 flex-1">
                      {/* Publishers section */}
                      <div className="mb-4">
                        <h3 className="font-semibold">Publishers:</h3>
                        {topicInfo.publishers.length === 0 && <p>None</p>}
                        <ul className="list-disc pl-6">
                          {topicInfo.publishers.map((pub, i) => (
                            <li key={i}>
                              <button
                                onClick={() => handleNodeClick(pub.node_name, pub.node_namespace)}
                                className="text-blue-600 hover:underline"
                              >
                                {pub.node_name}
                              </button>{' '}
                              <em>({pub.node_namespace})</em> — {pub.topic_type}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Subscribers section */}
                      <div className="mb-4">
                        <h3 className="font-semibold">Subscribers:</h3>
                        {topicInfo.subscribers.length === 0 && <p>None</p>}
                        <ul className="list-disc pl-6">
                          {topicInfo.subscribers.map((sub, i) => (
                            <li key={i}>
                              <button
                                onClick={() => handleNodeClick(sub.node_name, sub.node_namespace)}
                                className="text-blue-600 hover:underline"
                              >
                                {sub.node_name}
                              </button>{' '}
                              <em>({sub.node_namespace})</em> — {sub.topic_type}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
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