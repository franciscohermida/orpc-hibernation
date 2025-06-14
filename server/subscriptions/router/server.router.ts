import { experimental_encodeHibernationRPCEvent as encodeHibernationRPCEvent } from '@orpc/server/hibernation'
import { eventPayloadSchema } from '../schemas/eventPayload'
import { pubClient } from '../orpc'

/**
 * Internal procedure for your main worker to call.
 * This is how your stateless API sends messages to connected clients.
 */
export const broadcast = pubClient.input(eventPayloadSchema).handler(async ({ input, context }) => {
  const websockets = context.getWebsockets()

  for (const ws of websockets) {
    const data = ws.deserializeAttachment()
    if (typeof data !== 'object' || data === null) {
      continue
    }

    ws.send(encodeHibernationRPCEvent(data.id, input))
  }
})

export const serverRouter = {
  broadcast,
}
