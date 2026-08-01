import type { RawConversationResponse } from './tree-model'

type Callback = (data: RawConversationResponse) => void
let listener: Callback | null = null

/** Register a callback invoked whenever conversation data is intercepted. */
export function onConversationData(cb: Callback): () => void {
  listener = cb
  return () => {
    listener = null
  }
}

/** Monkey-patches window.fetch to intercept conversation API responses. */
export function installInterceptor(): void {
  const nativeFetch = window.fetch

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

    const response = await nativeFetch.call(window, input, init)

    if (url.match(/^https:\/\/(www\.)?chatgpt\.com\/backend-api\/conversation\/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}\/?$/)) {
      const cloned = response.clone()
      try {
        const body: RawConversationResponse = await cloned.json()
        if (listener) listener(body)
        // Relay to sidebar via isolated-world bridge
        window.postMessage({ type: 'gptree:send', message: { type: 'gptree:conversation', payload: body } }, '*')
      } catch {
        // Non-JSON response, ignore
      }
    }

    return response
  }
}
