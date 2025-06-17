import { onUnmounted, watchEffect } from 'vue'
import type { publicRouter } from '../../server/subscriptions/router/public.router'
import type { InferRouterOutputs, RouterClient } from '@orpc/server'
import { useWSClient } from './useWSClient'

export type Outputs = InferRouterOutputs<typeof publicRouter>

export function useEventNotifications(args: {
  handler: (
    // TODO: is there a better way to do this?
    message: Awaited<
      ReturnType<RouterClient<typeof publicRouter>['onEvent']>
    > extends AsyncIterator<infer T>
      ? T
      : never,
  ) => void
}) {
  let controller: AbortController | null = null

  const { wsClient } = useWSClient()
  watchEffect(() => {
    const client = wsClient.value
    if (client != null) {
      controller?.abort()
      controller = new AbortController()
      ;(async () => {
        for await (const message of await client.onEvent(undefined, {
          signal: controller.signal,
        })) {
          args.handler(message)
        }
      })()
    }
  })

  onUnmounted(() => {
    controller?.abort()
  })

  return {
    wsClient,
  }
}
