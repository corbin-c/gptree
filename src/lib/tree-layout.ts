import dagre from "dagre";
import type { ConversationTree, GptreeNode } from "./tree-model";

const NODE_WIDTH = 200;
const NODE_HEIGHT = 60;
const HIDDEN_ROLES = new Set<GptreeNode["role"]>(["system", "tool"]);

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

/** Walk through hidden nodes to find the nearest visible descendants */
function getVisibleDescendants(
  startId: string,
  allNodes: Map<string, GptreeNode>,
  visibleNodes: ReadonlySet<string>,
): string[] {
  const result: string[] = [];
  const stack = [startId];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const id = stack.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const node = allNodes.get(id);
    if (!node) continue;

    if (visibleNodes.has(id)) {
      result.push(id);
    } else {
      // Hidden node — keep searching through its children
      stack.push(...node.childrenIds);
    }
  }

  return result;
}

export function computeTreeLayout(tree: ConversationTree): {
  nodes: LayoutNode[];
  links: LayoutLink[];
} {
  // Build set of visible node IDs (exclude system / tool)
  const visibleNodes = new Set<string>();
  for (const [id, node] of tree.nodes) {
    if (!HIDDEN_ROLES.has(node.role)) {
      visibleNodes.add(id);
    }
  }

  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: "TB",
    nodesep: 16,
    ranksep: 40,
    marginx: 20,
    marginy: 20,
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Add only visible nodes
  for (const [id] of tree.nodes) {
    if (visibleNodes.has(id)) {
      g.setNode(id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    }
  }

  // Add edges, skipping hidden nodes and wiring through them
  for (const [, node] of tree.nodes) {
    if (!visibleNodes.has(node.id)) continue;
    for (const childId of node.childrenIds) {
      const descendants = getVisibleDescendants(childId, tree.nodes, visibleNodes);
      for (const descId of descendants) {
        g.setEdge(node.id, descId);
      }
    }
  }

  dagre.layout(g);

  const nodes: LayoutNode[] = [];
  for (const [id, node] of tree.nodes) {
    if (!visibleNodes.has(id)) continue;
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
    if (!visibleNodes.has(node.id)) continue;
    for (const childId of node.childrenIds) {
      const descendants = getVisibleDescendants(childId, tree.nodes, visibleNodes);
      for (const descId of descendants) {
        links.push({
          source: node.id,
          target: descId,
          isOnActivePath: tree.activePath.has(descId),
        });
      }
    }
  }

  return { nodes, links };
}
