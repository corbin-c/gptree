import { useState, useRef, useEffect, useCallback } from "react";
import { PanelHeader } from "./PanelHeader";
import { TreeView } from "./TreeView";
import type { ConversationTree } from "../lib/tree-model";

interface Props {
  isOpen: boolean;
  width: number;
  onResize: (width: number) => void;
  onClose: () => void;
  tree: ConversationTree | null;
  status: "idle" | "loading" | "loaded" | "error";
  error: string | null;
}

const MIN_WIDTH = 250;
const MAX_WIDTH_PCT = 0.6;

export function SidePanel({
  isOpen,
  width,
  onResize,
  onClose,
  tree,
  status,
  error,
}: Props) {
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current = width;
    },
    [width]
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = startXRef.current - e.clientX;
      let newWidth = startWidthRef.current + deltaX;
      const maxWidth = window.innerWidth * MAX_WIDTH_PCT;
      newWidth = Math.max(MIN_WIDTH, Math.min(maxWidth, newWidth));
      onResize(newWidth);
    };

    const handleMouseUp = () => setIsResizing(false);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, onResize]);

  // Keyboard shortcut: Ctrl+Shift+T toggles panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "T") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Push ChatGPT content left when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.marginRight = `${width}px`;
      document.body.style.transition = "margin-right 0.2s ease";
    } else {
      document.body.style.marginRight = "";
      document.body.style.transition = "";
    }
    return () => {
      document.body.style.marginRight = "";
      document.body.style.transition = "";
    };
  }, [isOpen, width]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        height: "100vh",
        width: `${width}px`,
        zIndex: 10000,
        background: "var(--gptree-bg, #212121)",
        color: "var(--gptree-text, #ECECF1)",
        borderLeft: "1px solid var(--gptree-border, #565869)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "13px",
        display: "flex",
        flexDirection: "column",
        transform: isOpen ? "translateX(0)" : `translateX(${width}px)`,
        transition: "transform 0.2s ease",
        boxShadow: isOpen ? "-4px 0 24px rgba(0,0,0,0.3)" : "none",
      }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "4px",
          cursor: "col-resize",
          background: isResizing
            ? "var(--gptree-accent, #10A37F)"
            : "transparent",
          transition: "background 0.15s",
          zIndex: 2,
        }}
        onMouseEnter={(e) => {
          if (!isResizing)
            (e.target as HTMLElement).style.background =
              "var(--gptree-accent, #10A37F)44";
        }}
        onMouseLeave={(e) => {
          if (!isResizing)
            (e.target as HTMLElement).style.background = "transparent";
        }}
      />

      <PanelHeader onClose={onClose} />

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "4px 0",
        }}
      >
        {status === "idle" && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100px",
              color: "var(--gptree-muted, #8E8EA0)",
              padding: "16px",
              textAlign: "center",
            }}
          >
            Navigate to a conversation to see its tree.
          </div>
        )}

        {status === "error" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "16px",
              gap: "8px",
              color: "var(--gptree-error, #EF4444)",
            }}
          >
            <p style={{ margin: 0, textAlign: "center", fontSize: "12px" }}>
              {error}
            </p>
          </div>
        )}

        {status === "loaded" && tree && (
          <TreeView tree={tree} />
        )}
      </div>

      {/* Inject keyframes for spinner */}
      <style>{`
        @keyframes gptree-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
