import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { parseConversationTree, updateCurrentNode } from "../lib/tree-model";
import type { ConversationTree } from "../lib/tree-model";
import { TreeView } from "../components/TreeView";
import "@xyflow/react/dist/style.css";
import { ReactFlowProvider } from "@xyflow/react";
import "../styles/sidebar.css";

export default function TreeTab() {
  const [tree, setTree] = useState<ConversationTree | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message?.type === "gptree:conversation") {
        const payload = message.payload;
        if (!payload?.mapping || !payload?.current_node) return;
        try {
          const parsed = parseConversationTree(payload);
          setTree(parsed);
          setError(null);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Parse error");
          setTree(null);
        }
      } else if (message?.type === "gptree:current-node-changed") {
        const payload = message.payload;
        if (!payload?.current_node) return;

        setTree((currentTree) => {
          if (!currentTree) return currentTree;
          try {
            return updateCurrentNode(currentTree, payload.current_node);
          } catch {
            return currentTree;
          }
        });
      }
    };
    browser.runtime.onMessage.addListener(handleMessage);
    return () => {
      browser.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  useEffect(() => {
    if (searchVisible && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchVisible]);

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      if (tree?.activePath.has(nodeId)) return;
      console.log("[gptree-sidebar] sending switch-to-node:", nodeId);
      browser.runtime.sendMessage({
        type: "gptree:switch-to-node",
        targetId: nodeId,
      }).catch(() => {});
    },
    [tree],
  );

  const handleNodeHover = useCallback(
    (nodeId: string | null) => {
      setHoveredNodeId(nodeId);
    },
    [],
  );

  const hoveredNode = hoveredNodeId && tree ? tree.nodes.get(hoveredNodeId) : null;

  const searchResults = useMemo(() => {
    const matches = new Set<string>();
    const term = searchQuery.trim().toLowerCase();
    if (!tree || !term) return matches;
    for (const [id, node] of tree.nodes) {
      if (node.content.toLowerCase().includes(term)) {
        matches.add(id);
      }
    }
    return matches;
  }, [searchQuery, tree]);

  if (error) {
    return (
      <div
        style={{
          width: "100%",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          color: "#ef4444",
          background: "var(--gptree-bg, #212121)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: 13,
        }}
      >
        {error}
      </div>
    );
  }

  if (!tree) {
    return (
      <div
        style={{
          width: "100%",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          color: "var(--gptree-muted, #8E8EA0)",
          background: "var(--gptree-bg, #212121)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: 13,
        }}
      >
        Navigate to a conversation to see its tree.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <button
        onClick={() => {
          setSearchVisible(!searchVisible);
          if (searchVisible) setSearchQuery("");
        }}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 10,
          background: searchVisible ? 'var(--gptree-accent, #10A37F)' : 'var(--gptree-node-bg, #2A2A32)',
          border: '1px solid var(--gptree-border, #3E3E4A)',
          borderRadius: 6,
          color: searchVisible ? '#fff' : 'var(--gptree-text, #ECECF1)',
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: 16,
          lineHeight: 1,
          padding: 0,
        }}
        title="Search nodes"
      >
        &#x1F50D;
      </button>
      {searchVisible && (
        <input
          type="text"
          ref={searchInputRef}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search in messages..."
          autoFocus
          style={{
            position: 'absolute',
            top: 46,
            left: 8,
            right: 8,
            zIndex: 10,
            background: 'var(--gptree-node-bg, #2A2A32)',
            border: '1px solid var(--gptree-accent, #10A37F)',
            borderRadius: 6,
            color: 'var(--gptree-text, #ECECF1)',
            padding: '6px 10px',
            fontSize: 13,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            outline: 'none',
          }}
        />
      )}
      <ReactFlowProvider>
        <TreeView tree={tree} onNodeClick={handleNodeClick} onNodeHover={handleNodeHover} searchResults={searchResults} />
      </ReactFlowProvider>
      {hoveredNode && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: '30%',
          background: 'var(--gptree-node-bg, #2A2A32)',
          borderTop: '1px solid var(--gptree-border, #3E3E4A)',
          padding: '10px 14px',
          overflow: 'auto',
          fontSize: 12,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: 'var(--gptree-text, #ECECF1)',
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          <div style={{
            color: 'var(--gptree-muted, #8E8EA0)',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 6,
            fontWeight: 600,
          }}>
            {hoveredNode.role}
          </div>
          {hoveredNode.content}
        </div>
      )}
    </div>
  );
}
