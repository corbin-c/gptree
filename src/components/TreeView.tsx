import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import type { ConversationTree } from "../lib/tree-model";
import {
  computeTreeLayout,
  type LayoutLink,
} from "../lib/tree-layout";
import { TreeNode } from "./TreeNode";

const NODE_WIDTH = 200;
const NODE_HEIGHT = 38;

export function TreeView({ tree }: { tree: ConversationTree }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startTX: 0, startTY: 0 });

  // ── Observe container size ──────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setDimensions({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Compute layout ──────────────────────────────────────────
  const layout = useMemo(
    () => computeTreeLayout(tree, NODE_WIDTH, NODE_HEIGHT),
    [tree],
  );

  // ── Pan handlers ────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    setDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startTX: transformRef.current.x,
      startTY: transformRef.current.y,
    };
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      const s = transformRef.current.scale;
      setTransform((prev) => ({
        ...prev,
        x: dragRef.current.startTX + (e.clientX - dragRef.current.startX) / s,
        y: dragRef.current.startTY + (e.clientY - dragRef.current.startY) / s,
      }));
    };
    const handleUp = () => setDragging(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragging]);

  // ── Zoom handler (scroll wheel) ─────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(4, Math.max(0.3, prev.scale * delta)),
    }));
  }, []);

  // ── Generate curved link path ───────────────────────────────
  const getLinkPath = (link: LayoutLink): string => {
    const sy = link.source.y + NODE_HEIGHT / 2;
    const ty = link.target.y - NODE_HEIGHT / 2;
    const midY = (sy + ty) / 2;
    return `M ${link.source.x} ${sy} C ${link.source.x} ${midY}, ${link.target.x} ${midY}, ${link.target.x} ${ty}`;
  };

  // ── Filter out root sentinel ────────────────────────────────
  const visibleNodes = layout.nodes.filter((n) => n.role !== "root");

  const svgWidth = Math.max(dimensions.width, layout.bounds.width);
  const svgHeight = Math.max(dimensions.height, layout.bounds.height);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", overflow: "hidden" }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{
          cursor: dragging ? "grabbing" : "grab",
          background: "var(--gptree-bg, #212121)",
        }}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
      >
        <g
          transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}
        >
          {/* ── Edges ────────────────────────────────────────── */}
          {layout.links.map((link, i) => (
            <path
              key={i}
              d={getLinkPath(link)}
              fill="none"
              stroke={
                link.isOnActivePath
                  ? "var(--gptree-accent, #10A37F)"
                  : "var(--gptree-muted, #8E8EA0)"
              }
              strokeWidth={link.isOnActivePath ? 2 : 1}
              strokeDasharray={link.isOnActivePath ? undefined : "4 4"}
              opacity={link.isOnActivePath ? 0.7 : 0.3}
            />
          ))}

          {/* ── Nodes ───────────────────────────────────────── */}
          {visibleNodes.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              nodeWidth={NODE_WIDTH}
              nodeHeight={NODE_HEIGHT}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
