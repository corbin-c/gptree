import type { RawConversationResponse } from './tree-model'

type Callback = (data: RawConversationResponse) => void
let listener: Callback | null = null

/**
 * Register a callback to be invoked whenever ChatGPT fetches
 * conversation data. Returns an unsubscribe function.
 */
export function onConversationData(cb: Callback): () => void {
  listener = cb
  return () => {
    listener = null
  }
}

/**
 * Monkey-patches window.fetch to intercept ChatGPT's own
 * conversation API requests and forward the response data
 * to any registered listener.
 */
export function installInterceptor(): void {
  console.log('installing interceptor')
  const nativeFetch = window.fetch

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

    const response = await nativeFetch.call(window, input, init)

    // if (url.includes('/backend-api/conversation/') && listener) {
    if (url.match(/^https:\/\/(www\.)?chatgpt\.com\/backend-api\/conversation\/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}\/?$/) && listener) {
      console.log(response)
      const cloned = response.clone()
      try {
        const body: RawConversationResponse = await cloned.json()
        listener(body)
      } catch {
        // Non-JSON response, ignore
      }
    }

    return response
  }
}
