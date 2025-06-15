import { pub } from '../orpc'
import { experimental_HibernationEventIterator as HibernationEventIterator } from '@orpc/server/hibernation'
import { InferRouterInputs } from '@orpc/server'
import { internalRouter } from './internal.router'

type Inputs = InferRouterInputs<typeof internalRouter>

/**
 * Client-facing procedure to start listening for events.
 */
export const onEvent = pub.handler(async ({ context }) => {
  return new HibernationEventIterator<Inputs['broadcast']>((id) => {
    // Associate the connection with a unique ID for the hibernation service
    context.ws.serializeAttachment({ id })
  })
})

export const ping = pub.handler(async () => {
  return {
    message: 'pong',
  }
})

// TODO: how to use publisher?
// export const onEvent2 = pubClient.handler(async function* ({ context, signal }) {
//   for await (const payload of publisher.subscribe('todo', { signal: signal })) {
//     yield encodeHibernationRPCEvent(...)
//   }
// })

export const publicRouter = {
  onEvent,
  ping,
}
