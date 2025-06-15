import { os } from '@orpc/server'
import { experimental_RPCHandler as RPCHandler } from '@orpc/server/websocket'

export interface PublicContext {
  env: Env
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: RPCHandler<any>
  ws: WebSocket
  getWebsockets: () => WebSocket[]
}

export interface InternalContext {
  env: Env
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: RPCHandler<any>
  getWebsockets: () => WebSocket[]
}

export const pub = os.$context<PublicContext>()
export const internal = os.$context<InternalContext>()
