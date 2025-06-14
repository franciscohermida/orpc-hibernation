import { EventPublisher } from '@orpc/server'
import { Todo } from '../rpc/schemas/todo'

// TODO: not sure how to use this with hibernation
export const publisher = new EventPublisher<{
  todo: {
    type: 'created' | 'updated' | 'deleted'
    todo: Todo
  }
}>()
