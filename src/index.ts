/**
 * Does something useful for sure
 * @returns 1
 * @public
 */
export const one = 1
/**
 * Does something useful for sure
 * @returns 2
 * @public
 */
export const two = 2

/**
 * Does something useful for sure
 * @returns 1
 * @public
 */
export interface Answer {
  text: string
  messageId: string
  conversationId: string
  parentMessageId: string
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
  conversationId?: string
  parentMessageId?: string
  arkoseToken?: string
  screenWidth?: number
  screenHeight?: number
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
import { ChatgptMode, getUserConfig } from './config'
import { ADAY, APPSHORTNAME, HALFHOUR } from './utils/consts'
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
    ret = ret.split('for summarizing :')[1]
  } catch (e) {
    console.log(e)
  }
  ret = ret.split('.', 1)[0]
  try {
    ret = APPSHORTNAME + ':' + ret.split(':')[1].trim()
  } catch (e) {
    console.log(e)
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
 * @param token - access token
 * @returns 1
 * @public
 */
export class ChatGPTProvider implements Provider {
  constructor(private token: string) {
    this.token = token
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
    const config = await getUserConfig()
    const cleanup = () => {
      // if (conversationId) {
      // setConversationProperty(this.token, conversationId, { is_visible: false })
      // }
    }

    console.log('ChatGPTProvider:ChatgptMode', config.chatgptMode)
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



