import { useState, useEffect } from 'react'
import type { ConversationTree } from '../lib/tree-model'
import { parseConversationTree } from '../lib/tree-model'
import { onConversationData } from '../lib/interceptor'

export interface TreeState {
  tree: ConversationTree | null
  status: 'idle' | 'loading' | 'loaded' | 'error'
  error: string | null
}

export function useConversationTree() {
  const [state, setState] = useState<TreeState>({
    tree: null,
    status: 'idle',
    error: null
  })

  useEffect(() => {
    return onConversationData((data) => {
      try {
        console.log(data)
        const tree = parseConversationTree(data)
        setState({ tree, status: 'loaded', error: null })
      } catch (e) {
        setState({
          tree: null,
          status: 'error',
          error: e instanceof Error ? e.message : 'Failed to parse conversation'
        })
      }
    })
  }, [])

  return state
}
