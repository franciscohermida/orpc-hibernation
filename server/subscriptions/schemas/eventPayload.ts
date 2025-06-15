import { z } from 'zod'
import { TodoSchema } from '../../rpc/schemas/todo'

// Define specific event schemas for better type safety
export const todoEventSchema = z.discriminatedUnion('event', [
  z.object({
    event: z.literal('todo.created'),
    payload: TodoSchema,
  }),
  z.object({
    event: z.literal('todo.updated'),
    payload: TodoSchema,
  }),
  z.object({
    event: z.literal('todo.deleted'),
    payload: TodoSchema,
  }),
])

// #region In a real app with multiple domains, you might have other schemas.
export const PostSchema = z.object({
  id: z.number(),
  title: z.string(),
  body: z.string(),
})

export const postEventSchema = z.discriminatedUnion('event', [
  z.object({
    event: z.literal('post.created'),
    payload: PostSchema,
  }),
  z.object({
    event: z.literal('post.updated'),
    payload: PostSchema,
  }),
  z.object({
    event: z.literal('post.deleted'),
    payload: PostSchema,
  }),
])
// #endregion

// Main event payload schema - currently only includes todo events
// To add post events, change this to: z.union([todoEventSchema, postEventSchema])
export const eventPayloadSchema = z.union([todoEventSchema, postEventSchema])
export type EventPayload = z.infer<typeof eventPayloadSchema>
