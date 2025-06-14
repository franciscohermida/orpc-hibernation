import { os } from '@orpc/server'
import { experimental_RPCHandler as RPCHandler } from '@orpc/server/websocket'

export interface ClientContext {
  env: Env
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: RPCHandler<any>
  ws: WebSocket
  getWebsockets: () => WebSocket[]
}

export interface ServerContext {
  env: Env
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: RPCHandler<any>
  ws: WebSocket
  getWebsockets: () => WebSocket[]
}

export const pubClient = os.$context<ClientContext>()
export const pubServer = os.$context<ServerContext>()
