import { z } from 'zod'
import { type ORPCContext, pub } from '../orpc'
import { ORPCError } from '@orpc/server'
import { type Todo, TodoSchema } from '../schemas/todo'
import { RPCLink } from '@orpc/client/fetch'
import { createORPCClient } from '@orpc/client'
import type { RouterClient } from '@orpc/server'
import { internalRouter } from '../../subscriptions/router/internal.router'

// Simple in-memory database is enough for this example even though workers are stateless
const todos: Todo[] = [
  { id: 1, text: 'Buy milk', done: false },
  { id: 2, text: 'Walk the dog', done: true },
]
let nextId = 3

export const listTodos = pub.handler(async () => {
  return todos
})

export const createTodo = pub
  .input(z.object({ text: z.string().min(1) }))
  .handler(async ({ input, context }) => {
    const newTodo = {
      id: nextId++,
      text: input.text,
      done: false,
    }
    todos.push(newTodo)

    await broadcastTodoEvent(context, 'todo.created', newTodo)

    return newTodo
  })

export const updateTodo = pub.input(TodoSchema).handler(async ({ input, context }) => {
  const todo = todos.find((t) => t.id === input.id)
  if (!todo) {
    throw new ORPCError('NOT_FOUND', { message: 'Todo not found' })
  }
  if (input.done !== undefined) {
    todo.done = input.done
  }
  if (input.text !== undefined) {
    todo.text = input.text
  }

  await broadcastTodoEvent(context, 'todo.updated', todo)

  return todo
})

export const deleteTodo = pub
  .input(
    z.object({
      id: z.coerce.number(),
    }),
  )
  .handler(async ({ input, context }) => {
    const todoIndex = todos.findIndex((t) => t.id === input.id)
    if (todoIndex === -1) {
      throw new ORPCError('NOT_FOUND', { message: 'Todo not found' })
    }
    const [deletedTodo] = todos.splice(todoIndex, 1)

    await broadcastTodoEvent(context, 'todo.deleted', deletedTodo)

    return deletedTodo
  })

export const todoRouter = {
  list: listTodos,
  create: createTodo,
  update: updateTodo,
  delete: deleteTodo,
}

async function broadcastTodoEvent(
  context: ORPCContext,
  event: `todo.${'created' | 'updated' | 'deleted'}`,
  payload: Todo,
) {
  const doId = context.env.SUBSCRIPTION_DO.idFromName(`user:${context.userId}`)
  const doStub = context.env.SUBSCRIPTION_DO.get(doId)

  const link = new RPCLink({
    url: 'http://internal',
    fetch: (request) => doStub.fetchInternal(request),
  })

  const doClient: RouterClient<typeof internalRouter> = createORPCClient(link)

  await doClient.broadcast({
    event,
    payload,
  })
}
