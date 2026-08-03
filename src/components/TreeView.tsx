import { useMemo, useEffect } from 'react'
import { ReactFlow, type Node, type Edge, useReactFlow } from '@xyflow/react'
import { GptreeNode } from './TreeNode'
import { computeTreeLayout } from '../lib/tree-layout'
import type { ConversationTree } from '../lib/tree-model'

const nodeTypes = { gptreeNode: GptreeNode }

export function TreeView({ tree, searchResults, onNodeClick, onNodeHover }: { tree: ConversationTree; searchResults?: Set<string>; onNodeClick?: (nodeId: string) => void; onNodeHover?: (nodeId: string | null) => void }) {
  const layout = useMemo(() => computeTreeLayout(tree), [tree])

  const { fitView } = useReactFlow();

  useEffect(() => {
    if (searchResults && searchResults.size > 0) {
      const matchingNodeIds = nodes.filter(n => searchResults.has(n.id)).map(n => ({ id: n.id }));
      if (matchingNodeIds.length > 0) {
        fitView({ nodes: matchingNodeIds, padding: 0.3, duration: 300 });
      }
    }
  }, [searchResults]);

  const nodes: Node[] = useMemo(
    () =>
      layout.nodes
        .filter((n) => n.role !== 'root')
        // .filter((n) => n.role !== "root" && n.role !== "system" && n.role !== "tool")
        .map((n) => ({
          id: n.id,
          type: 'gptreeNode',
          position: n.position,
          data: {
            role: n.role,
            preview: n.preview,
            content: n.content,
            isOnActivePath: n.isOnActivePath,
            isCurrentNode: n.isCurrentNode,
            childrenCount: n.childrenCount,
            isSearchMatch: searchResults?.has(n.id) ?? false
          }
        })),
    [layout, searchResults]
  )

  const edges: Edge[] = useMemo(
    () =>
      layout.links.map((l) => ({
        id: `${l.source}->${l.target}`,
        source: l.source,
        target: l.target,
        type: 'smoothstep',
        animated: false,
        style: {
          stroke: l.isOnActivePath ? 'var(--gptree-accent, #10A37F)' : 'var(--gptree-muted, #8E8EA0)',
          strokeWidth: l.isOnActivePath ? 2 : 1,
          opacity: l.isOnActivePath ? 0.7 : 0.3,
          strokeDasharray: l.isOnActivePath ? undefined : '4 4'
        }
      })),
    [layout]
  )

  return (
    <div style={{ width: '100%', height: '100vh', background: 'var(--gptree-bg, #212121)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.1}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_event, node) => {
          if (onNodeClick && !node.data.isOnActivePath) {
            onNodeClick(node.id)
          }
        }}
        onNodeMouseEnter={(_event, node) => onNodeHover?.(node.id)}
        onNodeMouseLeave={() => onNodeHover?.(null)}
      ></ReactFlow>
    </div>
  )
}
