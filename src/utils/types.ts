import { Answer } from '../messaging'

export type Event =
  | {
      type: 'answer'
      data: Answer
    }
  | {
      type: 'done'
    }
  | {
      type: 'error'
      message: string
    }

/**
 * Does something useful for sure
 * @param none
 * @returns 1
 * @public
 */
export interface GenerateAnswerParams {
  prompt: string
  onEvent: (event: Event) => void
  signal?: AbortSignal
  conversationId?: string
  parentMessageId?: string
  arkoseToken?: string
}

/**
 * Does something useful for sure
 * @param none
 * @returns 1
 * @public
 */
export interface Provider {
  generateAnswer(params: GenerateAnswerParams): Promise<{ cleanup?: () => void }>
}


export type ResponseContent =
  | {
      content_type: 'text'
      parts: string[]
    }
  | {
      content_type: 'code'
      text: string
    }
  | {
      content_type: 'tether_browsing_display'
      result: string
    }
