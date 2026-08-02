import { Handle, Position, type NodeProps } from '@xyflow/react'

const ROLE_ICONS: Record<string, string> = {
  user: '\uD83D\uDC64',
  assistant: '\uD83E\uDD16',
  system: '\u2699\uFE0F',
  tool: '\uD83D\uDD27'
}

interface GptreeNodeData {
  role: string
  preview: string
  isOnActivePath: boolean
  isCurrentNode: boolean
  childrenCount: number
  nodeId: string
  onNodeClick?: (nodeId: string) => void
}

export function GptreeNode({ data }: NodeProps) {
  const { role, preview, isOnActivePath, isCurrentNode, childrenCount, nodeId, onNodeClick } = data as unknown as GptreeNodeData

  const isClickable = !isOnActivePath

  return (
    <div
      onClick={isClickable && onNodeClick ? () => onNodeClick?.(nodeId) : undefined}
      style={{
        background: isOnActivePath ? 'var(--gptree-node-bg, #2A2A32)' : 'var(--gptree-node-dim-bg, #1E1E26)',
        border: isCurrentNode ? '2px solid var(--gptree-accent, #10A37F)' : '1px solid var(--gptree-border, #3E3E4A)',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 13,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: 'var(--gptree-text, #ECECF1)',
        opacity: isOnActivePath ? 1 : 0.45,
        width: 200,
        cursor: isClickable ? 'pointer' : 'default',
        ...(isClickable ? { transition: 'border-color 0.15s' } : {})
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}
      >
        <span style={{ fontSize: 14 }}>{ROLE_ICONS[role] || '\u2753'}</span>
        <span
          style={{
            color: 'var(--gptree-muted, #8E8EA0)',
            fontSize: 12,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1
          }}
        >
          {preview}
        </span>
        {childrenCount > 1 && (
          <span
            style={{
              background: 'var(--gptree-accent, #10A37F)',
              color: '#fff',
              fontSize: 10,
              fontWeight: 600,
              padding: '1px 6px',
              borderRadius: 10,
              flexShrink: 0
            }}
          >
            +{childrenCount - 1}
          </span>
        )}
      </div>
      <Handle type="target" position={Position.Top} style={{ background: 'transparent', border: 'none', width: 1, height: 1 }} />
      <Handle type="source" position={Position.Bottom} style={{ background: 'transparent', border: 'none', width: 1, height: 1 }} />
    </div>
  )
}
