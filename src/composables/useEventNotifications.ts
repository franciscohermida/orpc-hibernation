import { onUnmounted, shallowRef, watch, type ComputedRef } from 'vue'
import { WebSocket } from 'partysocket'
import { experimental_RPCLink as WSLink } from '@orpc/client/websocket'
import { createORPCClient } from '@orpc/client'
import type { publicRouter } from '../../server/subscriptions/router/public.router'
import type { InferRouterOutputs, RouterClient } from '@orpc/server'

export type Outputs = InferRouterOutputs<typeof publicRouter>

export function useNotifications(args: {
  websocketUrl: ComputedRef<string>
  handler: (
    // TODO: is there a better way to get this type?
    message: Awaited<
      ReturnType<RouterClient<typeof publicRouter>['onEvent']>
    > extends AsyncIterator<infer T>
      ? T
      : never,
  ) => void
}) {
  let websocket: WebSocket = new WebSocket(args.websocketUrl.value, undefined, { debug: true })
  let controller = new AbortController()
  let wsLink = new WSLink({
    websocket,
  })
  const wsClient = shallowRef<RouterClient<typeof publicRouter>>(createORPCClient(wsLink))

  startEventListener()

  // Re-initialize when URL changes
  watch(args.websocketUrl, () => {
    controller.abort()
    websocket.close()

    websocket = new WebSocket(args.websocketUrl.value, undefined, { debug: true })

    wsLink = new WSLink<typeof publicRouter>({
      websocket,
    })
    wsClient.value = createORPCClient(wsLink)

    startEventListener()
  })

  function startEventListener() {
    controller = new AbortController()
    ;(async () => {
      for await (const message of await wsClient.value.onEvent(undefined, {
        signal: controller.signal,
      })) {
        args.handler(message)
      }
    })()
  }

  onUnmounted(() => {
    websocket.close()
    controller.abort()
  })

  return {
    wsClient,
  }
}
