// ── ChatGPT API Raw Types ──────────────────────────────────────────

export interface RawMappingNode {
  id: string
  message: {
    id: string
    author: { role: string; name: string | null; metadata: Record<string, unknown> }
    content: { content_type: string; parts: string[] }
    status: string
    end_turn: boolean | null
    weight: number
    metadata: Record<string, unknown>
    recipient: string
    channel: string | null
  } | null
  parent: string | null
  children: string[]
}

export interface RawConversationResponse {
  title: string
  mapping: Record<string, RawMappingNode>
  current_node: string
  conversation_id: string
}

// ── Internal Tree Types ────────────────────────────────────────────

export interface GptreeNode {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool' | 'root'
  preview: string
  content: string
  parentId: string | null
  childrenIds: string[]
}

export interface ConversationTree {
  nodes: Map<string, GptreeNode>
  rootId: string
  currentNodeId: string
  /** All node IDs on the path from root to current_node */
  activePath: Set<string>
}

// ── Helpers ────────────────────────────────────────────────────────

const MAX_PREVIEW_LENGTH = 30

function getNodePreview(parts: string[]): string {
  const text = parts.join(' ').replace(/\s+/g, ' ').trim()
  if (text.length <= MAX_PREVIEW_LENGTH) return text
  return text.slice(0, MAX_PREVIEW_LENGTH - 3) + '...'
}

function getRole(raw: RawMappingNode): GptreeNode['role'] {
  if (!raw.message) return 'root'
  const role = raw.message.author.role
  if (role === 'user' || role === 'assistant' || role === 'system' || role === 'tool') {
    return role
  }
  return 'assistant' // fallback
}

// ── Main Parser ────────────────────────────────────────────────────

export function parseConversationTree(data: RawConversationResponse): ConversationTree {
  if (!data?.mapping) throw new Error('Invalid conversation data: missing mapping')
  const nodes = new Map<string, GptreeNode>()
  let rootId = ''

  // Build all nodes
  for (const [id, raw] of Object.entries(data.mapping)) {
    const role = getRole(raw)
    const parts = raw.message?.content?.parts
    const content = parts ? parts.join('\n') : ''
    const preview = parts ? getNodePreview(parts) : ''

    nodes.set(id, {
      id,
      role,
      preview,
      content,
      parentId: raw.parent,
      childrenIds: raw.children
    })

    if (raw.parent === null) {
      rootId = id
    }
  }

  // Compute active path: walk from current_node up to root
  const activePath = new Set<string>()
  let cursor: string | null = data.current_node
  while (cursor && nodes.has(cursor)) {
    activePath.add(cursor)
    const node = nodes.get(cursor)!
    cursor = node.parentId
  }
  // Include root
  if (rootId) activePath.add(rootId)

  // Extend downstream through default branch (last child at each level)
  let downstreamCursor: string | null = data.current_node
  while (downstreamCursor && nodes.has(downstreamCursor)) {
    const node: GptreeNode = nodes.get(downstreamCursor)!
    if (node.childrenIds.length > 0) {
      downstreamCursor = node.childrenIds[node.childrenIds.length - 1]
      activePath.add(downstreamCursor as string)
    } else {
      break
    }
  }

  return { nodes, rootId, currentNodeId: data.current_node, activePath }
}

export function updateCurrentNode(tree: ConversationTree, newCurrentNodeId: string): ConversationTree {
  if (!tree.nodes.has(newCurrentNodeId)) {
    throw new Error(`Node not found in tree: ${newCurrentNodeId}`)
  }

  const activePath = new Set<string>()
  let cursor: string | null = newCurrentNodeId
  while (cursor && tree.nodes.has(cursor)) {
    activePath.add(cursor)
    const node: GptreeNode = tree.nodes.get(cursor)!
    cursor = node.parentId
  }
  activePath.add(tree.rootId)

  // Extend downstream through default branch (last child at each level)
  let downstreamCursor: string | null = newCurrentNodeId
  while (downstreamCursor && tree.nodes.has(downstreamCursor)) {
    const node: GptreeNode = tree.nodes.get(downstreamCursor)!
    if (node.childrenIds.length > 0) {
      downstreamCursor = node.childrenIds[node.childrenIds.length - 1]
      activePath.add(downstreamCursor as string)
    } else {
      break
    }
  }

  return { ...tree, currentNodeId: newCurrentNodeId, activePath }
}
