/**
 * Does something useful for sure
 * @returns 1
 * @public
 */
export enum ErrorCode {
  CONVERSATION_LIMIT = 'CONVERSATION_LIMIT',
  UNKOWN_ERROR = 'UNKOWN_ERROR',
  CHATGPT_CLOUDFLARE = 'CHATGPT_CLOUDFLARE',
  CHATGPT_UNAUTHORIZED = 'CHATGPT_UNAUTHORIZED',
  GPT4_MODEL_WAITLIST = 'GPT4_MODEL_WAITLIST',
  BING_UNAUTHORIZED = 'BING_UNAUTHORIZED',
  BING_FORBIDDEN = 'BING_FORBIDDEN',
  API_KEY_NOT_SET = 'API_KEY_NOT_SET',
  BARD_EMPTY_RESPONSE = 'BARD_EMPTY_RESPONSE',
  MISSING_POE_HOST_PERMISSION = 'MISSING_POE_HOST_PERMISSION',
  POE_UNAUTHORIZED = 'POE_UNAUTHORIZED',
  MISSING_HOST_PERMISSION = 'MISSING_HOST_PERMISSION',
  XUNFEI_UNAUTHORIZED = 'XUNFEI_UNAUTHORIZED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  POE_MESSAGE_LIMIT = 'POE_MESSAGE_LIMIT',
  CLAUDE_WEB_UNAUTHORIZED = 'CLAUDE_WEB_UNAUTHORIZED',
  CLAUDE_WEB_UNAVAILABLE = 'CLAUDE_WEB_UNAVAILABLE',
  PI_WEB_UNAUTHORIZED = 'PI_WEB_UNAUTHORIZED',
  PI_WEB_UNAVAILABLE = 'PI_WEB_UNAVAILABLE',
  PI_EMPTY_RESPONSE = 'PI_EMPTY_RESPONSE'
}


/**
 * ////////ChatGPT Code starts here////////
 */


/**
 * Does something useful for sure
 * @returns 1
 * @public
 */
export interface Answer {
  text: string
  messageId?: string //used in chatgpt
  conversationId?: string //used in chatgpt
  parentMessageId?: string //used in chatgpt
  conversationContext?: any //used in bard
}

/**
 * Does something useful for sure
 * @returns 1
 * @public
 */
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
 * @returns 1
 * @public
 */
export interface GenerateAnswerParams {
  prompt: string
  onEvent: (event: Event) => void
  signal?: AbortSignal
  conversationId?: string //needed for Chatgpt
  parentMessageId?: string //needed for Chatgpt
  conversationContext?: any //needed for Bard
  displayTab?: string
  arkoseToken?: string //needed for Chatgpt
  screenWidth?: number //needed for Chatgpt
  screenHeight?: number //needed for Chatgpt
}

/**
 * Does something useful for sure
 * @param generateAnswer -  generates answer
 * @returns 1
 * @public
 */
export interface Provider {
  generateAnswer(params: GenerateAnswerParams): Promise<{ cleanup?: () => void }>
}


/**
 * Does something useful for sure
 * @returns 1
 * @public
 */
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

import { Buffer } from 'buffer'
import dayjs from 'dayjs'
import { createParser } from 'eventsource-parser'
import ExpiryMap from 'expiry-map'
import { sha3_512 } from 'js-sha3'
import { v4 as uuidv4 } from 'uuid'
import Browser from 'webextension-polyfill'
import WebSocketAsPromised from 'websocket-as-promised'
// import { ChatgptMode, getUserConfigForLLM } from './config'
import { ADAY, APPSHORTNAME, HALFHOUR, GITHUB_HOME } from './utils/consts'
import { parseSSEResponse, parseSSEResponse3 } from './utils/sse'
import { fetchSSE } from './utils/fetch-sse'
// import { GenerateAnswerParams, ResponseContent, Provider } from './utils/types'

dayjs().format()

async function request(token: string, method: string, path: string, data?: unknown) {
  return fetch(`https://chatgpt.com/backend-api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  })
}

function removeCitations(text: string) {
  return text.replaceAll(/\u3010\d+\u2020source\u3011/g, '')
}

// const getConversationTitle = (bigtext: string) => {
//   let ret = bigtext.split('\n', 1)[0]
//   ret = ret.split('.', 1)[0]
//   ret = APPSHORTNAME + ':' + ret.split(':')[1].trim()
//   console.log('getConversationTitle:', ret)
//   return ret
// }
const getConversationTitle = (bigtext: string) => {
  let ret = bigtext.split('\n', 1)[0]
  try {
    ret = ret?.split('for summarizing :')?.[1]
  } catch (e) {
    console.log("getConversationTitle", e)
  }
  ret = ret?.split('.', 1)[0]
  try {
    ret = APPSHORTNAME + ':' + ret.split(':')?.[1]?.trim()
  } catch (e) {
    console.log("getConversationTitle", e)
    ret = APPSHORTNAME + ':' + ret.trim().slice(0, 8) + '..'
  }
  return ret
}

const countWords = (text: string) => {
  return text.trim().split(/\s+/).length
}

// async function getChatgptwssIsOpenFlag() {
//   const { chatgptwssIsOpenFlag = false } = await Browser.storage.sync.get('chatgptwssIsOpenFlag')
//   return chatgptwssIsOpenFlag
// }

async function setChatgptwssIsOpenFlag(isOpen: boolean) {
  const { chatgptwssIsOpenFlag = false } = await Browser.storage.sync.get('chatgptwssIsOpenFlag')
  Browser.storage.sync.set({ chatgptwssIsOpenFlag: isOpen })
  return chatgptwssIsOpenFlag
}

async function request_new(
  token: string,
  method: string,
  path: string,
  data?: unknown,
  callback?: unknown,
) {
  return fetch(`https://chatgpt.com/backend-api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  })
    .then(function (response:any) {
      console.log('fetch', token != null, method, path, 'response', response)
      return response.json()
    })
    .then(function (data:any) {
      console.log('response data', data)
      if (callback) {
        console.log('callback', callback)
        // callback(token, data)
      }
    })
    .catch((error:any) => {
      console.error('fetch', token, method, path, 'error', error)
    })
}

/**
 * Does something useful for sure
 * @param token - access token
 *        data - data
 * @returns 1
 * @public
 */
export async function sendMessageFeedback(token: string, data: unknown) {
  await request(token, 'POST', '/conversation/message_feedback', data)
}

/**
 * Does something useful for sure
 * @param token - access token
 *        conversationId - string
 *        propertyObject - string
 * @returns 1
 * @public
 */
export async function setConversationProperty(
  token: string,
  conversationId: string,
  propertyObject: object,
) {
  await request(token, 'PATCH', `/conversation/${conversationId}`, propertyObject)
}

const browsertabIdConversationIdMap = new Map()
const windowIdConversationIdMap = new Map()

function deleteRecentConversations(token: string, data: any) {
  const now = dayjs()
  const startTime = dayjs(performance.timeOrigin)
  console.log('startTime', startTime)
  const convs = data.items
  console.log('convs', convs)
  for (let i = 0; i < convs.length; i++) {
    const conv_i_time = dayjs(convs[i].create_time)
    // console.log(
    //   'conv' + i,
    //   convs[i].id,
    //   conv_i_time,
    //   conv_i_time - startTime,
    //   now - conv_i_time,
    //   now - conv_i_time < ADAY,
    // )
    if (HALFHOUR < now.diff(conv_i_time) && now.diff(conv_i_time) < ADAY && convs[i].title.indexOf(APPSHORTNAME + ':') != -1) {
      setTimeout(function () {
        console.log('Deleting', token != null, convs[i].id)
        setConversationProperty(token, convs[i].id, { is_visible: false })
        const cloneBTCMap = new Map(browsertabIdConversationIdMap)
        cloneBTCMap.forEach((ConversationId, tabId, map) => {
          console.log('Looking for', ConversationId, tabId, 'in', map)
          if (ConversationId === convs[i].id) {
            console.log('Deleting ', ConversationId, tabId, 'from', map)
            browsertabIdConversationIdMap.delete(tabId)
            console.log(
              'browsertabIdConversationIdMap after Deleting ',
              browsertabIdConversationIdMap,
            )
          }
        })
        const cloneWCMap = new Map(windowIdConversationIdMap)
        cloneWCMap.forEach((conversationIdsConcatinated, windowId, map) => {
          console.log('Looking for', conversationIdsConcatinated, windowId, 'in', map)
          if (conversationIdsConcatinated.indexOf(convs[i].id) != -1) {
            console.log('Deleting ', convs[i].id, windowId, 'from', map)
            conversationIdsConcatinated = conversationIdsConcatinated.replace(convs[i].id, '')
            conversationIdsConcatinated = conversationIdsConcatinated.replace(',,', ',')
            windowIdConversationIdMap.set(windowId, conversationIdsConcatinated)
            console.log('windowIdConversationIdMap after Deleting ', windowIdConversationIdMap)
          }
        })
      }, i * 1000)
    }
  }
}

const KEY_ACCESS_TOKEN = 'accessToken'

const cache = new ExpiryMap(10 * 1000)

/**
 * Does something useful for sure
 * @returns 1
 * @public
 */
export async function getChatGPTAccessToken(): Promise<string> {
  if (cache.get(KEY_ACCESS_TOKEN)) {
    return cache.get(KEY_ACCESS_TOKEN)
  }
  const resp = await fetch('https://chatgpt.com/api/auth/session')
  if (resp.status === 403) {
    throw new Error('CLOUDFLARE')
  }
  const data:any = await resp.json().catch(() => ({}))
  if (!data.accessToken) {
    throw new Error('UNAUTHORIZED')
  }
  cache.set(KEY_ACCESS_TOKEN, data.accessToken)
  return data.accessToken
}

/**
 * Does something useful for sure
 * @param token - string
 *        userconfig - any
 * @returns 1
 * @public
 */
export class ChatGPTProvider implements Provider {
  constructor(private token: string, private userconfig: any) {
    //Brute:
    request_new(
      token,
      'GET',
      '/conversations?offset=0&limit=100&order=updated',
      undefined,
      deleteRecentConversations,
    )
  }

  async renameConversationTitle(convId: string, params: GenerateAnswerParams) {
    const titl: string = getConversationTitle(params.prompt)
    console.log('renameConversationTitle:', this.token, convId, titl)
    setConversationProperty(this.token, convId, { title: titl })
  }

  private async fetchModels(): Promise<
    { slug: string; title: string; description: string; max_tokens: number }[]
  > {
    const resp: any = await request(this.token, 'GET', '/models').then((r) => r.json())
    return resp.models
  }

  private async getModelName(): Promise<string> {
    try {
      const models = await this.fetchModels()
      return models[0].slug
    } catch (err) {
      console.error(err)
      return 'text-davinci-002-render'
    }
  }

  private async getDeviceId() {
    let { value } = await Browser.storage.sync.get('oai_device_id')
    if (!value) {
      value = uuidv4()
      Browser.storage.sync.set({ oai_device_id: value })
    }
    return value
  }

  private async getChatRequirementsToken(params: GenerateAnswerParams) {
    const deviceId = await this.getDeviceId()
    const resp = await fetch('https://chatgpt.com/backend-api/sentinel/chat-requirements', {
      method: 'POST',
      signal: params.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
        conversation_mode_kind: 'primary_assistant',
        'Oai-Device-Id': deviceId,
        'Oai-Language': 'en-US',
        Priority: 'u=1, i',
      },
      body: JSON.stringify({
        conversation_mode_kind: 'primary_assistant',
      }),
    })
    console.log('getChatRequirements:resp:', resp)
    let retToken = ''
    let retArkoseDx = ''
    let proofofworkSeed = ''
    let proofofworkDifficulty = ''
    let proofofworkRequired = ''
    await parseSSEResponse3(resp, (message: any) => {
      console.log('getChatRequirements:message:', message)
      retToken = message.token
      retArkoseDx = message.arkose?.dx as string
      proofofworkSeed = message.proofofwork?.seed as string
      proofofworkDifficulty = message.proofofwork?.difficulty as string
      proofofworkRequired = message.proofofwork?.required as string
    })
    console.log('retToken:', retToken)
    return [retToken, retArkoseDx, proofofworkSeed, proofofworkDifficulty, proofofworkRequired]
  }

  private getProofConfig(screenWidth: number, screenHeight: number) {
    return [
      navigator.hardwareConcurrency + screenWidth + screenHeight,
      new Date().toString(),
      4294705152,
      0,
      navigator.userAgent,
    ]
  }

  private async calcProofToken(
    seed: string,
    diff: string,
    screenWidth: number,
    screenHeight: number,
  ) {
    const config = this.getProofConfig(screenWidth, screenHeight)
    for (let i = 0; i < 1e5; i++) {
      config[3] = i
      const jsonData = JSON.stringify(config)
      const base = btoa(String.fromCharCode(...new TextEncoder().encode(jsonData)))
      const hashHex = sha3_512(seed + base)
      console.debug('POW', i, base, hashHex)
      if (hashHex.slice(0, diff.length) <= diff) {
        return 'gAAAAAB' + base
      }
    }
    const base = btoa(seed)
    return 'gAAAAABwQ8Lk5FbGpA2NcR9dShT6gYjU7VxZ4D' + base
  }

  async generateAnswerBySSE(params: GenerateAnswerParams, cleanup: () => void) {
    console.debug('ChatGPTProvider:generateAnswerBySSE:', params)
    const modelName = await this.getModelName()
    console.debug('ChatGPTProvider:modelName:', modelName)
    const [
      chatRequirementsToken,
      chatRequirementsAkroseDx,
      chatRequirementsProofofworkSeed,
      chatRequirementsProofofworkDifficulty,
      chatRequirementsProofofworkRequired,
    ] = await this.getChatRequirementsToken(params)
    console.log(
      'ChatGPTProvider:[chatRequirementsToken, chatRequirementsAkroseDx, chatRequirementsProofofworkSeed, chatRequirementsProofofworkDifficulty, chatRequirementsProofofworkRequired]',
      [
        chatRequirementsToken,
        chatRequirementsAkroseDx,
        chatRequirementsProofofworkSeed,
        chatRequirementsProofofworkDifficulty,
        chatRequirementsProofofworkRequired,
      ],
    )
    const deviceId = await this.getDeviceId()
    const websocketRequestId = uuidv4()
    let proofToken: string | undefined
    if (chatRequirementsProofofworkRequired) {
      proofToken = await this.calcProofToken(
        chatRequirementsProofofworkSeed as string,
        chatRequirementsProofofworkDifficulty as string,
        params.screenWidth as number,
        params.screenHeight as number,
      )
    }
    console.debug('ChatGPTProvider:this.token:', this.token)
    console.debug('ChatGPTProvider:modelName:', modelName)

    // This is a fix: https://stackoverflow.com/a/55238033/865220
    const requestHeaders: HeadersInit = new Headers();
    requestHeaders.set('Content-Type', 'application/json');
    requestHeaders.set('Authorization', `Bearer ${this.token}`);
    // requestHeaders.set('Openai-Sentinel-Arkose-Token', params.arkoseToken?params.arkoseToken:"");
    requestHeaders.set('Openai-Sentinel-Chat-Requirements-Token', chatRequirementsToken);
    requestHeaders.set('Oai-Device-Id', deviceId);
    requestHeaders.set('Oai-Language', 'en-US');
    if (proofToken){
      requestHeaders.set('Openai-Sentinel-Proof-Token', proofToken);
    }

    await fetchSSE('https://chatgpt.com/backend-api/conversation', {
      method: 'POST',
      signal: params.signal,
      headers: requestHeaders,
      body: JSON.stringify({
        action: 'next',
        messages: [
          {
            id: uuidv4(),
            author: { role: 'user' },
            content: {
              content_type: 'text',
              parts: [params.prompt],
            },
          },
        ],
        model: modelName,
        parent_message_id: params.parentMessageId || uuidv4(),
        // conversation_id: params.conversationId,
        arkose_token: params.arkoseToken,
        conversation_mode: {
          kind: 'primary_assistant',
        },
        history_and_training_disabled: !1,
        force_nulligen: !1,
        force_paragen: !1,
        force_rate_limit: !1,
        force_paragen_model_slug: '',
        suggestions: [],
        websocket_request_id: websocketRequestId,
      }),
      onMessage(message: string) {

        const renameConversationTitle = async (convId: string, params: GenerateAnswerParams) => {
          const titl: string = getConversationTitle(params.prompt)
          console.log('renameConversationTitle:', titl)
          // setConversationProperty(this.token, convId, { title: titl })
        }

        console.debug('ChatGPTProvider:generateAnswerBySSE:message', message)
        if (message.includes('wss_url')) {
          params.onEvent({ type: 'error', message: message })
          cleanup()
          return
        }
        if (message === '[DONE]') {
          params.onEvent({ type: 'done' })
          cleanup()
          return
        }
        let data
        try {
          data = JSON.parse(message)
        } catch (err) {
          console.error(err)
          return
        }
        const text = data.message?.content?.parts?.[0]
        if (text) {
          if (countWords(text) === 1 && data.message?.author?.role === 'assistant') {
            if (params.prompt.indexOf('search query:') !== -1) {
              renameConversationTitle(data.conversation_id, params)
            }
          }
          params.onEvent({
            type: 'answer',
            data: {
              text,
              messageId: data.message.id,
              parentMessageId: data.parent_message_id,
              conversationId: data.conversation_id,
            },
          })
        }
      },
    })
  }

  async setupWSS(params: GenerateAnswerParams, regResp: any) {
    console.log('ChatGPTProvider:setupWSS:regResp', regResp)
    let jj
    await parseSSEResponse(regResp, (message) => {
      console.log('ChatGPTProvider:setupWSS:parseSSEResponse:message', message)
      jj = JSON.parse(message)
    })
    console.log('ChatGPTProvider:jj', jj)
    if (jj) {
      const wsAddress = jj['wss_url']
      const wsp: WebSocketAsPromised = new WebSocketAsPromised(wsAddress, {
        createWebSocket: (url) => {
          console.log("createWebSocket:url", url)
          const ws = new WebSocket(wsAddress, [
            'Sec-Websocket-Protocol',
            'json.reliable.webpubsub.azure.v1',
          ])
          ws.binaryType = 'arraybuffer'
          return ws
        },
      })
      console.log('ChatGPTProvider:setupWebsocket:wsp', wsp)

      const openListener = async () => {
        console.log('ChatGPTProvider:setupWSS:openListener::wsp.onOpen')
        await setChatgptwssIsOpenFlag(true)
      }

      let next_check_seqid = Math.round(Math.random() * 50)
      const messageListener = (message: any) => {
        // console.log('ChatGPTProvider:setupWebsocket:wsp.onMessage:', message)
        const jjws = JSON.parse(message)
        console.log('ChatGPTProvider:setupWSS:messageListener:jjws:', jjws)
        const rawMessage = jjws['data'] ? jjws['data']['body'] : ''
        console.log('ChatGPTProvider:setupWSS:wsp.onMessage:rawMessage:', rawMessage)
        const b64decodedMessage = Buffer.from(rawMessage, 'base64')
        const finalMessageStr = b64decodedMessage.toString()
        console.log('ChatGPTProvider:setupWebsocket:wsp.onMessage:finalMessage:', finalMessageStr)

        const parser = createParser((parent_message) => {
          console.log('ChatGPTProvider:setupWSS:createParser:parent_message', parent_message) //event=`{data:'{}',event:undefine,id=undefined,type='event'}`
          let data
          try {
            if ((parent_message['data' as keyof typeof parent_message] as string) === '[DONE]') {
              console.log('ChatGPTProvider:setupWSS:createParser:returning DONE to frontend2')
              params.onEvent({ type: 'done' })
              wsp.close()
              return
            } else if (parent_message['data' as keyof typeof parent_message]) {
              data = JSON.parse(parent_message['data' as keyof typeof parent_message])
              console.log('ChatGPTProvider:setupWSS:createParser:data', data)
            }
          } catch (err) {
            console.log('ChatGPTProvider:setupWSS:createParser:Error', err)
            params.onEvent({ type: 'error', message: (err as any)?.message })
            wsp.close()
            return
          }
          const content = data?.message?.content as ResponseContent | undefined
          if (!content) {
            console.log('ChatGPTProvider:returning DONE to frontend3')
            params.onEvent({ type: 'done' })
            wsp.close()
            return
          }
          let text: string
          if (content.content_type === 'text') {
            text = content.parts[0]
            text = removeCitations(text)
          } else if (content.content_type === 'code') {
            text = '_' + content.text + '_'
          } else {
            console.log('ChatGPTProvider:returning DONE to frontend4')
            params.onEvent({ type: 'done' })
            wsp.close()
            return
          }
          if (text) {
            console.log('ChatGPTProvider:setupWSS:text', text)
            if (countWords(text) === 1 && data.message?.author?.role === 'assistant') {
              if (params.prompt.indexOf('search query:') !== -1) {
                this.renameConversationTitle(data.conversation_id, params)
              }
            }
            params.onEvent({
              type: 'answer',
              data: {
                text,
                messageId: data.message.id,
                parentMessageId: data.parent_message_id,
                conversationId: data.conversation_id,
              },
            })
          }
        })
        parser.feed(finalMessageStr)

        const sequenceId = jjws['sequenceId']
        console.log('ChatGPTProvider:doSendMessage:sequenceId:', sequenceId)
        if (sequenceId === next_check_seqid) {
          const t = {
            type: 'sequenceAck',
            sequenceId: next_check_seqid,
          }
          wsp.send(JSON.stringify(t))
          next_check_seqid += Math.round(Math.random() * 50)
        }
      }
      wsp.removeAllListeners()
      wsp.close()
      wsp.onOpen.addListener(openListener)
      wsp.onMessage.addListener(messageListener)
      wsp.onClose.removeListener(messageListener)
      wsp.open().catch(async (e) => {
        console.log('ChatGPTProvider:doSendMessage:showError:Error caught while opening ws', e)
        wsp.removeAllListeners()
        wsp.close()
        await setChatgptwssIsOpenFlag(false)
        params.onEvent({ type: 'error', message: (e as any)?.message })
      })
    }
  }

  async registerWSS(params: GenerateAnswerParams) {
    const resp = await fetch('https://chatgpt.com/backend-api/register-websocket', {
      method: 'POST',
      signal: params.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: void 0,
    })
    return resp
  }

  async generateAnswer(params: GenerateAnswerParams) {
    console.log('ChatGPTProvider:generateAnswer', params.arkoseToken)
    // let conversationId: string | undefined
    // const config = await getUserConfigForLLM()
    const cleanup = () => {
      // if (conversationId) {
      // setConversationProperty(this.token, conversationId, { is_visible: false })
      // }
    }

    // console.log('ChatGPTProvider:ChatgptMode', this.userconfig.chatgptMode)
    // if (config.chatgptMode === ChatgptMode.SSE) {
    //   this.generateAnswerBySSE(params, cleanup)
    // } else {
      const regResp = await this.registerWSS(params)
      await this.setupWSS(params, regResp) // Since params change WSS have to be setup up every time
      this.generateAnswerBySSE(params, cleanup)
    // }
    return { cleanup }
  }
}

/*////////////////////////////////ChatGPT Ends//////////////////////////*/
/**
 * ////////BARD Code starts here////////
 */


// import ExpiryMap from 'expiry-map'
import { ofetch } from 'ofetch'

// import { getUserConfig } from '~config'
// import { ConversationContext, GenerateAnswerParams, Provider } from '../types'

/**
 * Does something useful for sure
 * @param message - string
 *        code - any
 * @returns 1
 * @public
 */
export class ChatError extends Error {
  code: ErrorCode
  constructor(message: string, code: ErrorCode) {
    super(message)
    this.code = code
  }
}

// async function request(token: string, method: string, path: string, data?: unknown) {
//   return fetch(`https://chatgpt.com/backend-api${path}`, {
//     method,
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: `Bearer ${token}`,
//     },
//     body: data === undefined ? undefined : JSON.stringify(data),
//   })
// }

/**
 * Does something useful for sure
 * @returns 1
 * @public
 */
export async function sendMessageFeedbackBard(data: unknown) {
  console.log('TODO: Currently it is dummy, no feedback is actually sent')
  console.log('data:', data)
  // await request(token, 'POST', '/conversation/message_feedback', data);
}

// export async function setConversationProperty(
//   token: string,
//   conversationId: string,
//   propertyObject: object,
// ) {
//   await request(token, 'PATCH', `/conversation/${conversationId}`, propertyObject)
// }

// const KEY_ACCESS_TOKEN = 'accessToken'

// const cache = new ExpiryMap(10 * 1000)

// export async function getBardAccessToken(): Promise<string> {
//   if (cache.get(KEY_ACCESS_TOKEN)) {
//     return cache.get(KEY_ACCESS_TOKEN)
//   }
//   const resp = await fetch('https://chatgpt.com/api/auth/session')
//   if (resp.status === 403) {
//     throw new Error('CLOUDFLARE')
//   }
//   const data = await resp.json().catch(() => ({}))
//   if (!data.accessToken) {
//     throw new Error('UNAUTHORIZED')
//   }
//   cache.set(KEY_ACCESS_TOKEN, data.accessToken)
//   return data.accessToken
// }


/**
 * Does something useful with BARD for sure
 * @param token - string
 *        userconfig - any
 * @returns 1
 * @public
 */
export class BARDProvider implements Provider {
  private conversationContext?: any
  constructor(private token: string, private userconfig: any) {
  }

  private extractFromHTML(variableName: string, html: string) {
    const regex = new RegExp(`"${variableName}":"([^"]+)"`)
    const match = regex.exec(html)
    return match?.[1]
  }

  private async fetchRequestParams() {
    console.log("fetchRequestParams():this.userconfig", this.userconfig)
    // const userconfig = await getUserConfigForLLM()
    // console.log("fetchRequestParams():config", config)
    const html = await ofetch(this.userconfig.bardSubdomain + '/faq')
    const atValue = this.extractFromHTML('SNlM0e', html)
    const blValue = this.extractFromHTML('cfb2h', html)
    return { atValue, blValue }
  }

  private async parseBardResponseForImagesTab(resp: string) {
    console.log('parseBardResponseForImagesTab:resp:', resp)
    // const config = await getUserConfigForLLM()
    const data = JSON.parse(resp.split('\n')[3])
    const payload = JSON.parse(data[0][2])
    if (!payload) {
      throw new ChatError(
        'Failed to access Gemini, make sure you are logged in at ' + this.userconfig.bardSubdomain,
        ErrorCode.BARD_EMPTY_RESPONSE,
      )
    }
    console.debug('parseBardResponseForImagesTab:bard response payload', payload)

    try {
      let text:string = payload[4][0][1][0] as string
      const images = payload[4][0][4] || []
      for (const image of images) {
        const [media, source, placeholder] = image
        text = text.replace(placeholder, `[![${media[4]}](${media[0][0]})](${source[0][0]})`)
      }
      console.log('parseBardResponseForImagesTab:text/images', text)
      console.log('parseBardResponseForImagesTab:images.length', images.length)
      if (images.length === 0)
        text = "Sorry I couldn't find any images corresponding to this search query"
      return {
        text: text as string,
        ids: [...payload[1], payload[4][0][0]] as [string, string, string],
      }
    } catch (ex) {
      console.log('No text/images', ex)
    }

    //actually the following code was meant for videos but sometimes Bard returns this format when asked for images
    try {
      console.log('parseBardResponseForImagesTab:payload', payload)
      const datasplit = resp.split('\n')
      for (let i = 0; i < datasplit.length; i++) {
        console.log('parseBardResponseForImagesTab:', i, '=>', datasplit[i])
        try {
          const payloadagain = JSON.parse(JSON.parse(datasplit[i])[0][2])
          console.log('parseBardResponseForImagesTab:payloadagain', payloadagain)
          try {
            if (payloadagain[4]?.[0]?.[1]?.[0]) {
              const text:string = payloadagain[4][0][1][0] as string
              if (payloadagain[1] && payloadagain[4]?.[0]?.[0]) {
                return {
                  text: text as string,
                  ids: [...payloadagain[1], payloadagain[4][0][0]] as [string, string, string],
                }
              } else {
                return {
                  text: text as string,
                  ids: [],
                }
              }
            }
          } catch (e0) {
            console.log('parseBardResponseForImagesTab:Failed payloadagain[4][0][1][0] for ', i, e0)
          }
        } catch (e1) {
          console.log('parseBardResponseForImagesTab:Failed JSON for part ', i, e1)
        }
      }
    } catch (e2) {
      console.log('parseBardResponseForImagesTab:Reached end', e2)
    }

    //if it has reached here means no image was found
    const text:string = 'Sorry I could not find any image corresponding to this search query'
    return {
      text: text as string,
      ids: [],
    }
  }

  private async parseBardResponseForVideosTab(resp: string) {
    console.log('parseBardResponseForVideosTab')
    // const config = await getUserConfigForLLM()
    const data = JSON.parse(resp.split('\n')[3])
    const payload = JSON.parse(data[0][2])
    if (!payload) {
      throw new ChatError(
        'Failed to access Gemini, make sure you are logged in at ' + this.userconfig.bardSubdomain,
        ErrorCode.BARD_EMPTY_RESPONSE,
      )
    }
    console.debug('parseBardResponseForVideosTab:bard response payload', payload)

    try {
      console.log('parseBardResponseForVideosTab:payload', payload)
      const datasplit = resp.split('\n')
      let payloadagain
      for (let i = 0; i < datasplit.length; i++) {
        console.log(i, '=>', datasplit[i])
        if (datasplit[i].includes('videos')) {
          payloadagain = JSON.parse(JSON.parse(datasplit[i])[0][2])
          break
        }
      }
      console.log('parseBardResponseForVideosTab:payloadagain', payloadagain)
      const text:string = payloadagain[4][0][1][0] as string
      console.log('parseBardResponseForVideosTab:video text', text)
      return {
        text: text as string,
        ids: [...payloadagain[1], payloadagain[4][0][0]] as [string, string, string],
      }
    } catch (ex) {
      console.log('parseBardResponseForVideosTab:No videos', ex)
    }

    //if it has reached here means neither any image nor any video was found
    const text:string = 'Sorry I could not find any video corresponding to this search query'
    return {
      text: text as string,
      ids: [],
    }
  }

  private async parseBardResponse(resp: string, displayTab: string) {
    if (displayTab === 'Images') return this.parseBardResponseForImagesTab(resp)
    if (displayTab === 'Videos') return this.parseBardResponseForVideosTab(resp)
    // const config = await getUserConfigForLLM()
    const data = JSON.parse(resp.split('\n')[3])
    const payload = JSON.parse(data[0][2])
    if (!payload) {
      throw new ChatError(
        'Failed to access Gemini, make sure you are logged in at ' + this.userconfig.bardSubdomain,
        ErrorCode.BARD_EMPTY_RESPONSE,
      )
    }
    console.debug('bard response payload', payload)

    try {
      let text:string = payload[4][0][1][0] as string
      const images = payload[4][0][4] || []
      for (const image of images) {
        const [media, source, placeholder] = image
        text = text.replace(placeholder, `[![${media[4]}](${media[0][0]})](${source[0][0]})`)
      }
      console.log('text/images', text)
      console.log('images.length', images.length)
      return {
        text: text,
        ids: [...payload[1], payload[4][0][0]] as [string, string, string],
      }
    } catch (ex) {
      console.log('No text/images', ex)
    }

    //if it has reached here means neither any image nor any video was found
    try {
      const datasplit = resp.split('\n')
      let payloadagain
      let parseable = 0
      for (let i = 0; i < datasplit.length; i++) {
        console.log(i, 'nc=>', datasplit[i])
        try {
          payloadagain = JSON.parse(JSON.parse(datasplit[i])[0][2])
          parseable += 1
          if (parseable === 2) break
        } catch (ex) {
          console.log('Non parseable')
        }
      }
      console.log('payloadagain(nc)', payloadagain)
      let text:string = payloadagain[4][0][1][0] as string
      console.log('video text(nc)', text)
      return {
        text: text as string,
        ids: [...payloadagain[1], payloadagain[4][0][0]] as [string, string, string],
      }
    } catch (ex) {
      console.log('New case', ex)
    }
    return {'text': "", 'ids': [] }
  }

  private async generateReqId() {
    return Math.floor(Math.random() * 900000) + 100000
  }

  async generateAnswer(params: GenerateAnswerParams) {
    // const config = await getUserConfigForLLM()
    // let conversationId: string | undefined
    const cleanup = () => {
      // if (conversationId) {
      //   setConversationProperty(this.token, conversationId, { is_visible: false })
      // }
    }
    this.conversationContext = params.conversationContext

    if (!this.conversationContext) {
      this.conversationContext = {
        requestParams: await this.fetchRequestParams(),
        contextIds: ['', '', ''],
      }
    }
    const { requestParams, contextIds } = this.conversationContext
    console.debug('request ids:', contextIds)
    const resp = await ofetch(
      this.userconfig.bardSubdomain +
        '/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate',
      {
        method: 'POST',
        signal: params.signal,
        query: {
          bl: requestParams.blValue,
          _reqid: this.generateReqId(),
          rt: 'c',
        },
        body: new URLSearchParams({
          at: requestParams.atValue!,
          'f.req': JSON.stringify([
            null,
            `[[${JSON.stringify(params.prompt)}],null,${JSON.stringify(contextIds)}]`,
          ]),
        }),
        parseResponse: (txt) => txt,
      },
    )

    let j = await this.parseBardResponse(resp, params.displayTab?params.displayTab:"");
    let text = j?.['text']
    let ids = j?.['ids'] as [string, string, string]
    console.debug('text:', text)
    console.debug('response ids:', ids)
    this.conversationContext.contextIds = ids

    if (text) {
      // conversationId = 'dataconversation_id'
      params.onEvent({
        type: 'answer',
        data: {
          text: text,
          // messageId: 'datamessage.id',
          // conversationId: 'dataconversation_id',
          // parentMessageId: 'dataparent_message_id',
          conversationContext: this.conversationContext,
        },
      })
    }

    params.onEvent({ type: 'done' })
    cleanup()
    return { cleanup }
  }

  resetConversation() {
    this.conversationContext = undefined
  }
}



/*////////////////////////////////BARD Ends//////////////////////////*/
/**
 * ////////Claude Code starts here////////
 */



// import { ofetch } from 'ofetch'
// import { v4 as uuidv4 } from 'uuid'
// import { parseSSEResponse } from '../../utils/sse'
// import { createParser } from 'eventsource-parser'
// import { isEmpty } from 'lodash-es'
// import { getUserConfig } from '~config'
// import { GenerateAnswerParams, Provider } from '../types'
// import { ChatError, ErrorCode } from './errors'

// export class ChatError extends Error {
//   code: ErrorCode
//   constructor(message: string, code: ErrorCode) {
//     super(message)
//     this.code = code
//   }
// }

// import { streamAsyncIterable } from './stream-async-iterable'

// export async function* streamAsyncIterable(stream: ReadableStream) {
//   const reader = stream.getReader()
//   try {
//     while (true) {
//       const { done, value } = await reader.read()
//       if (done) {
//         return
//       }
//       yield value
//     }
//   } finally {
//     reader.releaseLock()
//   }
// }

// export async function parseSSEResponse(resp: Response, onMessage: (message: string) => void) {
//   if (!resp.ok) {
//     const error = await resp.json().catch(() => ({}))
//     if (!isEmpty(error)) {
//       throw new Error(JSON.stringify(error))
//     }
//     throw new ChatError(`${resp.status} ${resp.statusText}`, ErrorCode.NETWORK_ERROR)
//   }
//   const parser = createParser((event) => {
//     if (event.type === 'event') {
//       onMessage(event.data)
//     }
//   })
//   for await (const chunk of streamAsyncIterable(resp.body!)) {
//     const str = new TextDecoder().decode(chunk)
//     parser.feed(str)
//   }
// }

/**
 * Does something useful with Claude for sure
 * @param token - string
 *        userconfig - any
 *        conversationId - string
 *        organizationId - string
 * @returns 1
 * @public
 */
export class ClaudeProvider implements Provider {
  private conversationId: string
  private organizationId: string
  constructor(private token: string, private userconfig: any) {
    this.conversationId = ""
    this.organizationId = ""
  }

  private async get_organization_uuid() {
    console.log('Running get_organization_uuid')
    let response
    try {
      response = await fetch('https://claude.ai/api/organizations', {
        redirect: 'error',
        cache: 'no-cache',
      })
      console.log(response.status)
      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }
    } catch (u) {
      console.log('claude organizations error:', u)
      throw new Error(
        'Are you sure you are logged into [claude.ai](https://claude.ai) ? Try logging in and chatting directly once. If you are still not able to access then Claude webapp might not be avaiable in your country',
      )
    }
    if (response.status === 403) throw new Error('UNAUTHORIZED')
    this.organizationId = (await response.json())[0].uuid
    return this.organizationId
  }

  private async get_converstaionid_from_organization_uuid(org_uuid: string, prompt: string) {
    console.log('Running get_converstaionid_from_organization_uuid')
    this.conversationId = uuidv4() //"25fc12a7-31b8-4e90-bd79-062dc470c47d"
    await ofetch(`https://claude.ai/api/organizations/${org_uuid}/chat_conversations`, {
      method: 'POST',
      body: {
        name: prompt,
        uuid: this.conversationId,
      },
    })
    return this.conversationId
  }

  async generateAnswer(params: GenerateAnswerParams) {
    console.log('Running generateAnswer, params:', params)
    if (!this.organizationId) this.organizationId = await this.get_organization_uuid()

    if (params.conversationId) this.conversationId = params.conversationId

    if (!this.conversationId)
      this.conversationId = await this.get_converstaionid_from_organization_uuid(
        this.organizationId,
        params.prompt,
      )

    const cleanup = () => {
      // const x = 0
    }

    // const userConfig = await getUserConfig()
    console.log('Running generateAnswer, Calling append_message')
    const resp = await fetch(
      'https://claude.ai/api/organizations/' +
        this.organizationId +
        '/chat_conversations/' +
        this.conversationId +
        '/completion',
      {
        method: 'POST',
        signal: params.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attachments: [],
          files: [],
          // model: userConfig.claudeModel,
          timezone: 'Asia/Calcutta',
          prompt: params.prompt,
        }),
      },
    )

    let text = ''
    await parseSSEResponse(resp, (message) => {
      console.debug('claude sse message', message)
      let data
      try {
        data = JSON.parse(message)
      } catch (err) {
        console.error(err)
        return
      }
      console.debug('claude sse data.type', data.type)
      if (data.type === 'completion') {
        const content: string = data.completion
        if (!content && data.stop) {
          console.debug('claude content DONE')
          params.onEvent({ type: 'done' })
          return
        }
        console.debug('claude content', content)
        text += content
        console.debug('claude text', text)
        if (text) {
          params.onEvent({
            type: 'answer',
            data: {
              text: text.trimStart(),
              conversationId: this.conversationId,
            },
          })
        }
      }
    }).catch((err: Error) => {
      if (err.message.includes('token_expired')) {
        throw new Error(err.message)
      }
      throw err
    })

    return { cleanup }
  }
}



/*////////////////////////////////Claude Ends//////////////////////////*/
/**
 * ////////Pi Code starts here////////
 */


// import { parseSSEResponse } from '../../utils/sse'
// import { GenerateAnswerParams, Provider } from '../types'

// import { createParser } from 'eventsource-parser'
// import { isEmpty } from 'lodash-es'
// import { ChatError, ErrorCode } from './errors'

// import { streamAsyncIterable } from './stream-async-iterable'

/**
 * Does something useful for sure
 * @returns 1
 * @public
 */
export async function* streamAsyncIterable(stream: ReadableStream) {
  const reader = stream.getReader()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        return
      }
      yield value
    }
  } finally {
    reader.releaseLock()
  }
}

// export async function parseSSEResponse(resp: Response, onMessage: (message: string) => void) {
//   if (!resp.ok) {
//     const error = await resp.json().catch(() => ({}))
//     if (!isEmpty(error)) {
//       throw new Error(JSON.stringify(error))
//     }
//     throw new ChatError(`${resp.status} ${resp.statusText}`, ErrorCode.NETWORK_ERROR)
//   }
//   const parser = createParser((event) => {
//     if (event.type === 'event') {
//       onMessage(event.data)
//     }
//   })
//   for await (const chunk of streamAsyncIterable(resp.body!)) {
//     const str = new TextDecoder().decode(chunk)
//     parser.feed(str)
//   }
// }

/**
 * Does something useful for sure
 * @returns 1
 * @public
 */
export function website_login_request_message(WEBSITE: any) {
  return (
    " Also make sure that you are logged in this bot's website by visiting it's website " +
    WEBSITE +
    ' and checking if you are able to access it from there. If it works fine via web access but not via Seach-n-Chat sidebar then you may create an issue at ' +
    GITHUB_HOME +
    '/issues'
  )
}

/**
 * Does something useful with Pi for sure
 * @param token - string
 *        userconfig - any
 *        conversationId - string
 *        organizationId - string
 * @returns 1
 * @public
 */
export class PiProvider implements Provider {
  private conversationContext: any
  constructor(private token: string, private userconfig: any) {
    this.conversationContext = {
      initialized: !0,
    }
  }

  async generateAnswer(params: GenerateAnswerParams) {
    console.log('PiProvider:Running generateAnswer, params:', params)
    // if (!this.conversationContext) {
    //   this.conversationContext = {
    //     initialized: !0,
    //   }
    // }

    const resp = await fetch('https://pi.ai/api/chat', {
      method: 'POST',
      signal: params.signal,
      body: JSON.stringify({
        text: params.prompt,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    let text = ''
    await parseSSEResponse(resp, (message) => {
      console.debug('PiProvider:parseSSEResponse:message', message)
      const data = JSON.parse(message)
      try {
        if (data.text) {
          console.debug('PiProvider:parseSSEResponse:data.text', data.text)
          text = text + data.text
          console.debug('PiProvider:parseSSEResponse:data.text', text)
          params.onEvent({
            type: 'answer',
            data: {
              text: text,
            },
          })
        } else {
          console.debug('PiProvider:parseSSEResponse:No text in data:', data)
        }
      } catch (ex: any) {
        console.debug('PiProvider:parseSSEResponse:Error something in message:', message, ex)
      }
    }).catch((err: Error) => {
      console.log('PiProvider: error caught succesfully:err', err)
      throw new ChatError(
        'Failed to access Pi.' + website_login_request_message('https://pi.ai'),
        ErrorCode.PI_EMPTY_RESPONSE,
      )
    })

    console.debug('PiProvider:parseSSEResponse:done')
    params.onEvent({
      type: 'answer',
      data: {
        text: text,
      },
    })
    params.onEvent({
      type: 'done',
    })
    // text = ''

    const cleanup = () => {
      // const x = 0
    }

    return { cleanup }
  }
}

