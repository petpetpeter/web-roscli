'use client';

import React, { useMemo } from 'react';
import ROSGraph from './TopicGraph';
import { useRouter } from 'next/navigation';

type NodeInfo = {
  node_name: string;
  node_namespace: string;
  publishers: {
    topic: string;
    topic_type: string;
  }[];
  subscribers: {
    topic: string;
    topic_type: string;
  }[];
};

type NodeGraphProps = {
  nodeInfo: NodeInfo;
};

export default function NodeGraph({ nodeInfo }: NodeGraphProps) {
  const router = useRouter();

  const graphData = useMemo(() => {
    const nodes = [
      {
        id: `${nodeInfo.node_namespace}/${nodeInfo.node_name}`,
        name: nodeInfo.node_name,
        type: 'node' as const,
        namespace: nodeInfo.node_namespace,
      },
    ];

    const links = [];

    // Add publishers
    nodeInfo.publishers.forEach((pub) => {
      const topicId = pub.topic;
      nodes.push({
        id: topicId,
        name: pub.topic,
        type: 'topic' as const,
      });
      links.push({
        source: `${nodeInfo.node_namespace}/${nodeInfo.node_name}`,
        target: topicId,
        type: 'publishes_to',
      });
    });

    // Add subscribers
    nodeInfo.subscribers.forEach((sub) => {
      const topicId = sub.topic;
      // Only add topic node if it doesn't exist yet
      if (!nodes.some(n => n.id === topicId)) {
        nodes.push({
          id: topicId,
          name: sub.topic,
          type: 'topic' as const,
        });
      }
      links.push({
        source: topicId,
        target: `${nodeInfo.node_namespace}/${nodeInfo.node_name}`,
        type: 'subscribes_to',
      });
    });

    return { nodes, links };
  }, [nodeInfo]);

  const handleNodeClick = (node: any) => {
    if (node.type === 'topic') {
      router.push(`/topics?topic=${encodeURIComponent(node.name)}`);
    }
  };

  return <ROSGraph data={graphData} onNodeClick={handleNodeClick} />;
} 