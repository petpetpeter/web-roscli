'use client';

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { TopicInfo } from '../types';
import { useRouter } from 'next/navigation';

type NodeType = 'topic' | 'publisher' | 'subscriber' | 'node';

type GraphNode = {
  id: string;
  name: string;
  type: NodeType;
  namespace?: string;
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

type ROSGraphProps = {
  data: GraphData;
  onNodeClick?: (node: GraphNode) => void;
};

export default function ROSGraph({ data, onNodeClick }: ROSGraphProps) {
  const router = useRouter();
  const graphRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 200 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // Update dimensions when container size changes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: 200
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
    } else if (node.type !== 'topic') {
      const fullNodeName = node.namespace === '/' ? node.name : `${node.namespace}/${node.name}`;
      router.push(`/nodes?node=${encodeURIComponent(fullNodeName)}`);
    }
  }, [router, onNodeClick]);

  // Auto-fit the graph when it's ready
  useEffect(() => {
    if (graphRef.current) {
      // Wait for the graph to stabilize
      setTimeout(() => {
        graphRef.current.zoomToFit(400);
      }, 100);
    }
  }, [data, dimensions]);

  return (
    <div ref={containerRef} className="w-full h-[200px] border rounded-lg shadow-lg relative">
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
          if (graphRef.current) {
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