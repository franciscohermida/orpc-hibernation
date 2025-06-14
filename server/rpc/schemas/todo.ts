import { z } from 'zod'

export const TodoSchema = z.object({
  id: z.number(),
  text: z.string().min(1),
  done: z.boolean(),
})

export type Todo = z.infer<typeof TodoSchema>
