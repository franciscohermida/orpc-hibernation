import { os, ORPCError } from '@orpc/server'
import type { ORPCContext } from '../orpc'

export const getUserMiddleware = os
  .$context<ORPCContext & { userId?: string }>()
  .middleware(async ({ context, next }) => {
    const userId = context.request.headers.get('x-user-id')

    if (!userId) {
      throw new ORPCError('UNAUTHORIZED', { message: 'User ID is required' })
    }

    return next({
      context: {
        userId,
      },
    })
  })
