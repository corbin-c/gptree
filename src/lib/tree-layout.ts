import { hierarchy, tree } from "d3-hierarchy";
import type { ConversationTree, GptreeNode } from "./tree-model";

export interface LayoutNode {
  id: string;
  role: GptreeNode["role"];
  preview: string;
  content: string;
  x: number;
  y: number;
  isOnActivePath: boolean;
  isCurrentNode: boolean;
}

export interface LayoutLink {
  source: { x: number; y: number };
  target: { x: number; y: number };
  isOnActivePath: boolean;
}

/**
 * Converts the flat Map-based ConversationTree into a D3 hierarchy,
 * runs the tree layout algorithm, and returns positioned nodes + links.
 */
export function computeTreeLayout(
  conversationTree: ConversationTree,
  nodeWidth: number,
  nodeHeight: number,
): {
  nodes: LayoutNode[];
  links: LayoutLink[];
  bounds: { width: number; height: number };
} {
  const { nodes: nodeMap, rootId, activePath, currentNodeId } =
    conversationTree;

  // ── Build a nested structure for D3 ──────────────────────────
  interface D3Node {
    id: string;
    isOnActivePath: boolean;
    isCurrentNode: boolean;
    children?: D3Node[];
  }

  function buildD3Node(nodeId: string): D3Node {
    const node = nodeMap.get(nodeId)!;
    return {
      id: nodeId,
      isOnActivePath: activePath.has(nodeId),
      isCurrentNode: nodeId === currentNodeId,
      children:
        node.childrenIds.length > 0
          ? node.childrenIds.map(buildD3Node)
          : undefined,
    };
  }

  const d3Root = hierarchy(buildD3Node(rootId));

  // ── Compute layout ───────────────────────────────────────────
  const layout = tree<D3Node>().nodeSize([
    nodeWidth + 60, // horizontal gap between sibling subtrees
    nodeHeight + 80, // vertical gap between parent and child
  ]);
  layout(d3Root);

  // ── Flatten nodes ────────────────────────────────────────────
  const layoutNodes: LayoutNode[] = [];
  d3Root.each((d) => {
    const node = nodeMap.get(d.data.id)!;
    layoutNodes.push({
      id: d.data.id,
      role: node.role,
      preview: node.preview,
      content: node.content,
      x: d.x!,
      y: d.y!,
      isOnActivePath: d.data.isOnActivePath,
      isCurrentNode: d.data.isCurrentNode,
    });
  });

  // ── Build links ──────────────────────────────────────────────
  const layoutLinks: LayoutLink[] = d3Root.links().map((link) => ({
    source: { x: link.source.x!, y: link.source.y! },
    target: { x: link.target.x!, y: link.target.y! },
    isOnActivePath: (link.target.data as D3Node).isOnActivePath,
  }));

  // ── Compute bounds & offset to positive coordinates ──────────
  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;
  for (const n of layoutNodes) {
    if (n.x < minX) minX = n.x;
    if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.y > maxY) maxY = n.y;
  }
  const PAD = 60;
  const offsetX = -minX + PAD;
  const offsetY = -minY + PAD;

  for (const n of layoutNodes) {
    n.x += offsetX;
    n.y += offsetY;
  }
  for (const l of layoutLinks) {
    l.source.x += offsetX;
    l.source.y += offsetY;
    l.target.x += offsetX;
    l.target.y += offsetY;
  }

  const bounds = {
    width: maxX - minX + nodeWidth + PAD * 2,
    height: maxY - minY + nodeHeight + PAD * 2,
  };

  return { nodes: layoutNodes, links: layoutLinks, bounds };
}
