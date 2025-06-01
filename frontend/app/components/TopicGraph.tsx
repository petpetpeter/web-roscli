'use client';

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { TopicInfo } from '../types';
import { useRouter } from 'next/navigation';
import { useJourneyStore, JourneyItem } from '../store/journeyStore';

type NodeType = 'topic' | 'publisher' | 'subscriber' | 'node';

type GraphNode = {
  id: string;
  name: string;
  type: NodeType;
  namespace?: string;
  isHistory?: boolean;
};

type GraphLink = {
  source: string;
  target: string;
  type: 'publishes' | 'subscribes' | 'publishes_to' | 'subscribes_to';
};

type GraphData = {
  nodes: GraphNode[];
  links: GraphLink[];
};

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

type ROSGraphProps = {
  data?: GraphData;
  nodeInfo?: NodeInfo;
  onNodeClick?: (node: GraphNode) => void;
};

export default function ROSGraph({ data: propData, nodeInfo, onNodeClick }: ROSGraphProps) {
  const router = useRouter();
  const addToJourney = useJourneyStore(state => state.addItem);
  const graphRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 200 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const journeyItems = useJourneyStore(state => state.items);

  // Transform nodeInfo into graph data if provided
  const data = useMemo(() => {
    if (propData) return propData;
    if (!nodeInfo) return { nodes: [], links: [] };

    const nodes: GraphNode[] = [
      {
        id: `${nodeInfo.node_namespace}/${nodeInfo.node_name}`,
        name: nodeInfo.node_name,
        type: 'node',
        namespace: nodeInfo.node_namespace,
        isHistory: journeyItems.some((item: JourneyItem) => 
          item.type === 'node' && 
          item.name === nodeInfo.node_name && 
          item.namespace === nodeInfo.node_namespace
        )
      },
    ];

    const links: GraphLink[] = [];

    // Add publishers
    nodeInfo.publishers.forEach((pub) => {
      const topicId = pub.topic;
      nodes.push({
        id: topicId,
        name: pub.topic,
        type: 'topic',
        isHistory: journeyItems.some((item: JourneyItem) => 
          item.type === 'topic' && 
          item.name === pub.topic
        )
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
          type: 'topic',
          isHistory: journeyItems.some((item: JourneyItem) => 
            item.type === 'topic' && 
            item.name === sub.topic
          )
        });
      }
      links.push({
        source: topicId,
        target: `${nodeInfo.node_namespace}/${nodeInfo.node_name}`,
        type: 'subscribes_to',
      });
    });

    return { nodes, links };
  }, [propData, nodeInfo, journeyItems]);

  // Update dimensions when container size changes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        setDimensions({
          width: width,
          height: width // Make height equal to width for square aspect ratio
        });
      }
    };

    // Initial size
    updateDimensions();

    // Create resize observer
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Cleanup
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const nodeColor = useCallback((node: GraphNode) => {
    // If node is in history, use a lighter color
    if (node.isHistory) {
      switch (node.type) {
        case 'topic':
          return '#93c5fd'; // blue-300
        case 'publisher':
          return '#6ee7b7'; // emerald-300
        case 'subscriber':
          return '#fcd34d'; // amber-300
        case 'node':
          return '#c4b5fd'; // violet-300
        default:
          return '#d1d5db'; // gray-300
      }
    }
    
    // Regular colors for non-history nodes
    switch (node.type) {
      case 'topic':
        return '#3b82f6'; // blue-500
      case 'publisher':
        return '#10b981'; // emerald-500
      case 'subscriber':
        return '#f59e0b'; // amber-500
      case 'node':
        return '#8b5cf6'; // violet-500
      default:
        return '#6b7280'; // gray-500
    }
  }, []);

  const nodeLabel = useCallback((node: GraphNode) => {
    return node.name;
  }, []);

  const handleNodeClick = useCallback((node: GraphNode) => {
    if (onNodeClick) {
      onNodeClick(node);
    } else if (node.type === 'topic') {
      addToJourney({
        type: 'topic',
        name: node.name,
        namespace: node.namespace || '/'
      });
      router.push(`/topics?topic=${encodeURIComponent(node.name)}`);
    } else if (node.type === 'node' || node.type === 'publisher' || node.type === 'subscriber') {
      const fullNodeName = node.namespace === '/' ? node.name : `${node.namespace}/${node.name}`;
      addToJourney({
        type: 'node',
        name: node.name,
        namespace: node.namespace || '/'
      });
      router.push(`/nodes?node=${encodeURIComponent(fullNodeName)}`);
    }
  }, [router, onNodeClick, addToJourney]);

  // Auto-fit the graph when it's ready
  useEffect(() => {
    if (graphRef.current) {
      // Wait for the graph to stabilize
      const timeoutId = setTimeout(() => {
        if (graphRef.current) {  // Check again in case component unmounted
          graphRef.current.zoomToFit(400);
        }
      }, 100);
      
      // Cleanup timeout on unmount
      return () => clearTimeout(timeoutId);
    }
  }, [data, dimensions]);

  return (
    <div ref={containerRef} className="w-full aspect-square border rounded-lg shadow-lg relative">
      <ForceGraph2D
        ref={graphRef}
        graphData={data}
        nodeColor={nodeColor}
        nodeLabel={nodeLabel}
        nodeRelSize={6}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        linkColor={(link) => {
          switch (link.type) {
            case 'publishes':
            case 'publishes_to':
              return '#10b981'; // emerald-500
            case 'subscribes':
            case 'subscribes_to':
              return '#f59e0b'; // amber-500
            default:
              return '#6b7280'; // gray-500
          }
        }}
        backgroundColor="#ffffff"
        cooldownTicks={50}
        linkWidth={1}
        width={dimensions.width}
        height={dimensions.height}
        onNodeClick={handleNodeClick}
        onNodeHover={(node) => setHoveredNode(node)}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 12/globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

          // Draw node circle
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, 3, 0, 2 * Math.PI);
          ctx.fillStyle = nodeColor(node);
          ctx.fill();

          // Draw label if zoomed in enough
          if (globalScale > 0.5) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(
              node.x! - bckgDimensions[0] / 2,
              node.y! + 4,
              bckgDimensions[0],
              bckgDimensions[1]
            );
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#1f2937'; // gray-800 for better contrast
            ctx.fillText(
              label,
              node.x!,
              node.y! + 4 + bckgDimensions[1] / 2
            );
          }
        }}
        onEngineStop={() => {
          if (graphRef.current) {  // Add null check here too
            graphRef.current.zoomToFit(400);
          }
        }}
      />
      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-white/90 p-2 rounded shadow text-sm">
        {data.nodes.some(n => n.type === 'topic') && (
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-800">Topic</span>
          </div>
        )}
        {data.nodes.some(n => n.type === 'publisher') && (
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-gray-800">Publisher</span>
          </div>
        )}
        {data.nodes.some(n => n.type === 'subscriber') && (
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-gray-800">Subscriber</span>
          </div>
        )}
        {data.nodes.some(n => n.type === 'node') && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-violet-500"></div>
            <span className="text-gray-800">Node</span>
          </div>
        )}
      </div>
      {/* Hover tooltip */}
      {hoveredNode && (
        <div 
          className="absolute bg-white/90 p-2 rounded shadow text-sm pointer-events-none"
          style={{
            left: hoveredNode.x! + 10,
            top: hoveredNode.y! + 10,
            transform: 'translate(0, -50%)'
          }}
        >
          <div className="font-semibold text-gray-800">{hoveredNode.name}</div>
          <div className="text-gray-600">
            {hoveredNode.type === 'topic' ? 'Topic' : 
             hoveredNode.type === 'publisher' ? 'Publisher' :
             hoveredNode.type === 'subscriber' ? 'Subscriber' :
             'Node'}
          </div>
        </div>
      )}
    </div>
  );
} 