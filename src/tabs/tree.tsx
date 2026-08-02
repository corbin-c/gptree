import { useEffect, useState, useCallback } from "react";
import { parseConversationTree, updateCurrentNode } from "../lib/tree-model";
import type { ConversationTree } from "../lib/tree-model";
import { TreeView } from "../components/TreeView";
import "@xyflow/react/dist/style.css";
import "../styles/sidebar.css";

export default function TreeTab() {
  const [tree, setTree] = useState<ConversationTree | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  return <TreeView tree={tree} onNodeClick={handleNodeClick} />;
}
