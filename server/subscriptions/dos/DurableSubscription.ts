import { DurableObject } from 'cloudflare:workers'
import { experimental_RPCHandler as WSHandler } from '@orpc/server/websocket'
import { RPCHandler } from '@orpc/server/fetch'
import { experimental_HibernationPlugin as HibernationPlugin } from '@orpc/server/hibernation'
import { internalRouter } from '../router/internal.router'
import { publicRouter } from '../router/public.router'

// This handler is for incoming WebSocket connections from clients
const wsHandler = new WSHandler(publicRouter, {
  plugins: [new HibernationPlugin()],
})

// This handler is for incoming HTTP requests from your main worker
const rpcHandler = new RPCHandler(internalRouter)

export class DurableSubscription extends DurableObject<Env> {
  // public fetch handler
  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade')
    if (upgradeHeader === 'websocket') {
      // A client is connecting. Upgrade the connection to a WebSocket.
      const { '0': client, '1': server } = new WebSocketPair()
      this.ctx.acceptWebSocket(server)
      return new Response(null, { status: 101, webSocket: client })
    }

    return new Response('Not Found', { status: 404 })
  }

  // this can only be called from the main worker
  async fetchInternal(request: Request): Promise<Response> {
    // This is an internal HTTP call from your main worker to the `broadcast` procedure.
    const result = await rpcHandler.handle(request, {
      prefix: '/',
      context: {
        handler: wsHandler,
        getWebsockets: () => this.ctx.getWebSockets(),
        env: this.env,
      },
    })

    if (result.matched) {
      return result.response
    }
    return new Response('Not Found', { status: 404 })
  }

  // This lifecycle method is called when a message is received on a WebSocket.
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    // We forward the message to our WebSocket oRPC handler.
    await wsHandler.message(ws, message, {
      context: {
        handler: wsHandler,
        ws, // The handler needs to know which WebSocket the message came from
        getWebsockets: () => this.ctx.getWebSockets(),
        env: this.env,
      },
    })
  }

  // This is called when a client's WebSocket closes.
  async webSocketClose(ws: WebSocket): Promise<void> {
    wsHandler.close(ws)
  }
}
