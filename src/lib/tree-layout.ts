import dagre from "dagre";
import type { ConversationTree, GptreeNode } from "./tree-model";

const NODE_WIDTH = 200;
const NODE_HEIGHT = 60;

export interface LayoutNode {
  id: string;
  position: { x: number; y: number };
  role: GptreeNode["role"];
  preview: string;
  isOnActivePath: boolean;
  isCurrentNode: boolean;
  childrenCount: number;
}

export interface LayoutLink {
  source: string;
  target: string;
  isOnActivePath: boolean;
}

export function computeTreeLayout(tree: ConversationTree): {
  nodes: LayoutNode[];
  links: LayoutLink[];
} {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: "TB",
    nodesep: 16,
    ranksep: 40,
    marginx: 20,
    marginy: 20,
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes
  for (const [id] of tree.nodes) {
    g.setNode(id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  // Add edges
  for (const [, node] of tree.nodes) {
    for (const childId of node.childrenIds) {
      g.setEdge(node.id, childId);
    }
  }

  dagre.layout(g);

  const nodes: LayoutNode[] = [];
  for (const [id, node] of tree.nodes) {
    const pos = g.node(id);
    nodes.push({
      id,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y },
      role: node.role,
      preview: node.preview,
      isOnActivePath: tree.activePath.has(id),
      isCurrentNode: id === tree.currentNodeId,
      childrenCount: node.childrenIds.length,
    });
  }

  const links: LayoutLink[] = [];
  for (const [, node] of tree.nodes) {
    for (const childId of node.childrenIds) {
      links.push({
        source: node.id,
        target: childId,
        isOnActivePath: tree.activePath.has(childId),
      });
    }
  }

  return { nodes, links };
}
