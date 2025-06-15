import { experimental_encodeHibernationRPCEvent as encodeHibernationRPCEvent } from '@orpc/server/hibernation'
import { EventPayload } from '../schemas/eventPayload'
import { internal } from '../orpc'
import { type } from '@orpc/server'

/**
 * Internal procedure for your main worker to call.
 * This is how your stateless API sends messages to connected clients.
 */
export const broadcast = internal
  .input(type<EventPayload>())
  .handler(async ({ input, context }) => {
    const websockets = context.getWebsockets()

    for (const ws of websockets) {
      const data = ws.deserializeAttachment()
      if (typeof data !== 'object' || data === null) {
        continue
      }

      ws.send(encodeHibernationRPCEvent(data.id, input))
    }
  })

export const internalRouter = {
  broadcast,
}
