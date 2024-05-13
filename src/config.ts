// import { defaults } from 'lodash-es'
// import Browser from 'webextension-polyfill'

// export enum TriggerMode {
//   Always = 'always',
//   Manually = 'manually',
// }

// export const TRIGGER_MODE_TEXT = {
//   [TriggerMode.Always]: { title: 'Always', desc: 'Search-n-Chat.ai is queried on every search' },
//   [TriggerMode.Manually]: {
//     title: 'Manually',
//     desc: 'Search-n-Chat.ai is queried when you manually click a button',
//   },
// }

// export enum Theme {
//   Auto = 'auto',
//   Light = 'light',
//   Dark = 'dark',
// }

// export enum AppWidth {
//   Narrow = 'narrow',
//   Medium = 'medium',
//   Wide = 'wide',
// }

// export enum Language {
//   Auto = 'auto',
//   English = 'english',
//   Chinese = 'chinese',
//   Spanish = 'spanish',
//   French = 'french',
//   Korean = 'korean',
//   Japanese = 'japanese',
//   German = 'german',
//   Portuguese = 'portuguese',
// }

// export const Prompt =
//   'Please summarize the paper by author(s) in one concise sentence.\
//  Then, list key insights and lessons learned from the paper.\
//  Next, generate 3-5 questions that you would like to ask the authors about their work.\
//  Finally, provide 3-5 suggestions for related topics or future research directions \
//  based on the content of the paper.\
//  If applicable, list at least 5 relevant references from the field of study of the paper.\
//  Here is the paper. If the last sentence provided is incomplete just ignore it for summarizing :\
//  '

// const SEARCH_INSIGHTS_PROMPT =
//   'Provide some insights on the following search query(your response must be 200 words or more): '
// const SEARCH_SUMMARY_PROMPT = 'Summarise the results of the following search query in 200 words: '
// const SEARCH_IMAGE_PROMPT = 'Show me some pictures corresponding to the following search query: '
// const SEARCH_VIDEO_PROMPT = 'Show me some videos corresponding to the following search query: '
// export const followupQuestionsPrompt = () => {
//   return `After that suggest 3-4 follow-up questions as bullet points output for the above search query(You must use the following template: ### Follow-up Questions:).`
// }
// const SEARCH_JOKES_PROMPT =
//   'Can you think of some jokes or memes corresponding to the following search query: '

// export interface SitePrompt {
//   site: string
//   prompt: string
// }

// export enum ClaudeModel {
//   Calude20 = 'claude-2.0',
//   Calude21 = 'claude-2.1',
//   Calude30 = 'claude-3.0',
// }

// // export enum ChatgptMode {
// //   SSE = 'Server-Sent-Events',
// //   WSS = 'Web-Sockets',
// // }

// export enum BardSubdomains {
//   Bard = 'https://bard.google.com',
//   Gemini = 'https://gemini.google.com',
// }

// // const userConfigWithDefaultValue = {
// //   triggerMode: TriggerMode.Always,
// //   theme: Theme.Auto,
// //   appWidth: AppWidth.Narrow,
// //   language: Language.Auto,
// //   prompt: Prompt,
// //   // promptList: [
// //   //   SEARCH_INSIGHTS_PROMPT,
// //   //   SEARCH_SUMMARY_PROMPT,
// //   //   SEARCH_IMAGE_PROMPT,
// //   //   SEARCH_VIDEO_PROMPT,
// //   //   SEARCH_JOKES_PROMPT,
// //   // ],
// //   // prompt: SEARCH_INSIGHTS_PROMPT,
// //   promptOverrides: [] as SitePrompt[],
// //   claudeModel: ClaudeModel.Calude30,
// //   bardSubdomain: BardSubdomains.Gemini,
// //   chatgptMode: ChatgptMode.WSS,
// //   isFollowupsEnabled: true,
// // }

// // export type UserConfig = typeof userConfigWithDefaultValue

// export async function getUserConfigForLLM(): Promise<UserConfig> {
//   console.log("llm-playground-chain:getUserConfigForLLM()")
//   const result = await Browser.storage.local.get(Object.keys(userConfigWithDefaultValue))
//   console.log("llm-playground-chain:getUserConfigForLLM():result", result)
//   return defaults(result, userConfigWithDefaultValue)
// }

// // export async function updateUserConfig(updates: Partial<UserConfig>) {
// //   console.debug('update configs', updates)
// //   return Browser.storage.local.set(updates)
// // }

// export enum ProviderType {
//   ChatGPT = 'chatgpt',
//   GPT3 = 'gpt3',
//   BARD = 'bard',
//   CLAUDE = 'claude',
//   PI = 'pi',
// }

// interface GPT3ProviderConfig {
//   model: string
//   apiKey: string
// }

// export interface ProviderConfigs {
//   provider: ProviderType
//   //configs: {
//   //  [ProviderType.GPT3]: GPT3ProviderConfig | undefined
//   //}
//   enabledproviders: ProviderType[]
// }

// export async function getProviderConfigs(): Promise<ProviderConfigs> {
//   //const { provider = ProviderType.ChatGPT } = await Browser.storage.local.get('provider')
//   let { provider } = await Browser.storage.local.get('provider')
//   let { enabledproviders } = await Browser.storage.local.get('enabledproviders')
//   if (!provider) provider = ProviderType.BARD
//   if (!enabledproviders)
//     enabledproviders = [
//       ProviderType.ChatGPT,
//       ProviderType.BARD,
//       ProviderType.CLAUDE,
//       ProviderType.PI,
//     ]
//   const pc = { provider: provider, enabledproviders: enabledproviders } as ProviderConfigs
//   console.log('returning ProviderConfigs', pc)
//   return pc
// }

// export async function saveProviderConfigs(
//   provider: ProviderType,
//   //configs: ProviderConfigs['configs'],
//   enabledproviders: ProviderType[],
// ) {
//   console.log('about to saveProviderConfigs =', provider, enabledproviders)
//   let r1
//   if (provider)
//     r1 = Browser.storage.local.set({ provider: provider }).then(() => {
//       console.log('provider Value is set')
//     })
//   if (enabledproviders && enabledproviders.length > 0)
//     return Browser.storage.local.set({ enabledproviders: enabledproviders }).then(() => {
//       console.log('enabledproviders Value is set')
//     })
//   else return r1
// }
