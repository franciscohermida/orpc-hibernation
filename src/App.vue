<template>
  <div style="display: flex; align-items: center; gap: 10px">
    <h1>Todo List</h1>
    <button @click="fetchData">Refresh</button>
    <button @click="handlePing">Ping</button>
    <span style="margin-left: auto; font-size: 0.8em; color: #666"> User: {{ userId }} </span>
  </div>
  <div>
    <input v-model="createText" />
    <button @click="handleCreate">Create</button>
    <ul>
      <li
        v-for="todo in todos"
        :key="todo.id"
        :style="{ textDecoration: todo.done ? 'line-through' : 'none' }"
      >
        {{ todo.text }}
        <button @click="handleToggle(todo.id)">Toggle</button>
        <button @click="handleDelete(todo.id)">Delete</button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { z } from 'zod'
import { createORPCClient } from '@orpc/client'
import { experimental_RPCLink as WSLink } from '@orpc/client/websocket'
import type { RouterClient } from '@orpc/server'
import { RPCLink } from '@orpc/client/fetch'
import { publicRouter } from '../server/subscriptions/router/public.router'
import { router } from '../server/rpc/router'
import { TodoSchema } from '../server/rpc/schemas/todo'
import { WebSocket } from 'partysocket'

// get or create unique user id from local storage
let userId: string | null = localStorage.getItem('userId')
if (!userId) {
  userId = crypto.randomUUID()
  localStorage.setItem('userId', userId)
}

const todos = ref<z.infer<typeof TodoSchema>[]>([])

// #region RPC client
const rpcLink = new RPCLink({
  url: `${window.location.origin}/api/rpc`,
  headers: {
    'x-user-id': userId,
  },
})
const rpcClient: RouterClient<typeof router> = createORPCClient(rpcLink)
// #endregion

// #region WebSocket client
const websocket = new WebSocket(
  `${window.location.origin}/api/subscription?userId=${userId}`,
  undefined,
  { debug: true },
)

const wsLink = new WSLink({
  websocket,
})

const wsClient: RouterClient<typeof publicRouter> = createORPCClient(wsLink)
// #endregion

const controller = new AbortController()
void (async () => {
  for await (const message of await wsClient.onEvent(undefined, { signal: controller.signal })) {
    console.log('message received', message)

    if (message.event === 'todo.created') {
      todos.value.push(message.payload)
    } else if (message.event === 'todo.updated') {
      const item = todos.value.find((todo) => todo.id === message.payload.id)
      if (item) {
        Object.assign(item, message.payload)
      }
    } else if (message.event === 'todo.deleted') {
      todos.value = todos.value.filter((todo) => todo.id !== message.payload.id)
    }
    // Example of how to handle post events if it was implemented:
    else if (
      message.event === 'post.created' ||
      message.event === 'post.updated' ||
      message.event === 'post.deleted'
    ) {
      console.log('Post event:', message.payload.title)
    } else {
      // Handle unknown events
      console.warn('Unknown event:', message)
    }
  }
})()

const createText = ref('')
async function handleCreate() {
  await rpcClient.todo.create({ text: createText.value })
  createText.value = ''
}

async function handleToggle(id: number) {
  const item = todos.value.find((todo) => todo.id === id)
  if (!item) return
  await rpcClient.todo.update({ ...item, done: !item.done })
}

async function handleDelete(id: number) {
  await rpcClient.todo.delete({ id })
}

async function handlePing() {
  const data = await wsClient.ping()
  console.log('ping', data)
}

async function fetchData() {
  const data = await rpcClient.todo.list()
  todos.value = data
}
fetchData()

onUnmounted(() => {
  controller.abort()
})
</script>
