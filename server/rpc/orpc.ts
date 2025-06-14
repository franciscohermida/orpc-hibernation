import { os } from '@orpc/server'
import { getUserMiddleware } from './middleware/getUser.middleware'

export interface ORPCContext {
  env: Env
  request: Request
  userId?: string
}

export const pub = os.$context<ORPCContext>().use(getUserMiddleware)
