import type { LayoutNode } from "../lib/tree-layout";

interface Props {
  node: LayoutNode;
  nodeWidth: number;
  nodeHeight: number;
}

const ROLE_COLORS: Record<string, string> = {
  user: "#7B8CDE",
  assistant: "#10A37F",
  system: "#A0A0A0",
  tool: "#E5A040",
  root: "#555555",
};

const ROLE_ICONS: Record<string, string> = {
  user: "👤",
  assistant: "🤖",
  system: "⚙️",
  tool: "🔧",
  root: "",
};

export function TreeNode({ node, nodeWidth, nodeHeight }: Props) {
  if (node.role === "root") return null;

  const color = ROLE_COLORS[node.role] || "#888888";
  const icon = ROLE_ICONS[node.role] || "•";
  const halfW = nodeWidth / 2;
  const halfH = nodeHeight / 2;

  // Opacity based on path membership
  const groupOpacity = node.isOnActivePath ? 1 : 0.45;
  const bgOpacity = node.isCurrentNode ? 0.22 : node.isOnActivePath ? 0.12 : 0.06;
  const strokeOpacity = node.isCurrentNode ? 1 : node.isOnActivePath ? 0.55 : 0.25;
  const strokeWidth = node.isCurrentNode ? 2 : 1;

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      opacity={groupOpacity}
      style={{ cursor: "default", transition: "opacity 0.15s" }}
    >
      {/* ── Background ──────────────────────────────────────── */}
      <rect
        x={-halfW}
        y={-halfH}
        width={nodeWidth}
        height={nodeHeight}
        rx={6}
        fill={color}
        fillOpacity={bgOpacity}
        stroke={color}
        strokeOpacity={strokeOpacity}
        strokeWidth={strokeWidth}
      />

      {/* ── Left accent bar ─────────────────────────────────── */}
      <rect
        x={-halfW}
        y={-halfH}
        width={3}
        height={nodeHeight}
        rx={1.5}
        fill={color}
        fillOpacity={strokeOpacity}
      />

      {/* ── Role icon ───────────────────────────────────────── */}
      <text
        x={-halfW + 15}
        y={4}
        fontSize={12}
        textAnchor="middle"
        style={{ pointerEvents: "none" }}
      >
        {icon}
      </text>

      {/* ── Preview text ────────────────────────────────────── */}
      <text
        x={-halfW + 26}
        y={4}
        fontSize={11}
        fill="var(--gptree-text, #ECECF1)"
        style={{ pointerEvents: "none" }}
      >
        {node.preview || "(empty)"}
      </text>
    </g>
  );
}
