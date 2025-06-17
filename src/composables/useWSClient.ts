import { ref, shallowRef, watch } from 'vue'
import { WebSocket } from 'partysocket'
import { experimental_RPCLink as WSLink } from '@orpc/client/websocket'
import { createORPCClient } from '@orpc/client'
import type { publicRouter } from '../../server/subscriptions/router/public.router'
import type { InferRouterOutputs, RouterClient } from '@orpc/server'

export type Outputs = InferRouterOutputs<typeof publicRouter>

let websocket: WebSocket | null = null
const wsClient = shallowRef<RouterClient<typeof publicRouter> | null>(null)
const websocketUrl = ref<string | null>(null)

/**
 * Manages a single websocket connection for receiving event notifications.
 */
export function useWSClient() {
  watch(websocketUrl, () => {
    if (websocketUrl.value != null) {
      console.log('createWSClient', websocketUrl.value)

      websocket?.close()
      websocket = new WebSocket(websocketUrl.value, undefined, { debug: true })
      const wsLink = new WSLink({
        websocket,
      })
      const client: RouterClient<typeof publicRouter> = createORPCClient(wsLink)
      wsClient.value = client
    } else {
      websocket?.close()
      websocket = null
      wsClient.value = null
    }
  })

  return {
    // this should be guaranteed to be non-null
    wsClient,
    websocketUrl,
  }
}
