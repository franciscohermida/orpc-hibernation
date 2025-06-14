import { RPCHandler } from '@orpc/server/fetch'
import { router } from './rpc/router'

export { DurableSubscription } from './subscriptions/dos/DurableSubscription'

const rpcHandler = new RPCHandler(router)

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/rpc')) {
      const { matched, response } = await rpcHandler.handle(request, {
        prefix: '/api/rpc',
        context: { env, request },
      })

      if (matched) {
        return response
      }

      return new Response('Not found', { status: 404 })
    }

    if (url.pathname.startsWith('/api/subscription')) {
      const userId = url.searchParams.get('userId')
      if (!userId) {
        return new Response('Unauthorized: Missing user ID', { status: 401 })
      }
      const subscriptionDO = env.SUBSCRIPTION_DO.get(
        env.SUBSCRIPTION_DO.idFromName(`user:${userId}`),
      )

      if (subscriptionDO == null) {
        return new Response('Not found', { status: 404 })
      }

      return subscriptionDO.fetch(request)
    }

    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
