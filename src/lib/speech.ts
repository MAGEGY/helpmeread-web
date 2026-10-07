import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './languages'
import type { HistoryEntry, Language } from './languages'

const HISTORY_KEY = 'hmr_history'
const SETTINGS_KEY = 'hmr_settings'

export interface Settings {
  languageCode: string
  rate: number
  volume: number
}

export function getSettings(): Settings {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}')
    return { languageCode: s.languageCode ?? DEFAULT_LANGUAGE.code, rate: s.rate ?? 1, volume: s.volume ?? 1 }
  } catch {
    return { languageCode: DEFAULT_LANGUAGE.code, rate: 1, volume: 1 }
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function languageByCode(code: string): Language {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code) ?? DEFAULT_LANGUAGE
}

export function getHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function saveHistory(text: string, language: string): void {
  const history = getHistory()
  const id = history.reduce((max, h) => Math.max(max, h.id), 0) + 1
  history.push({ id, text, language, timestamp: Date.now() })
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-50)))
}

export function deleteHistory(id: number): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(getHistory().filter((h) => h.id !== id)))
}

// Web Speech API text-to-speech
export function speak(text: string, language: Language, rate: number, volume: number): void {
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = language.ttsLocale
  utterance.rate = rate
  utterance.volume = volume
  const voice = window.speechSynthesis
    .getVoices()
    .find((v) => v.lang.toLowerCase().startsWith(language.code))
  if (voice) utterance.voice = voice
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking(): void {
  window.speechSynthesis.cancel()
}

// Free translation via MyMemory (no key required)
export async function translate(text: string, from: Language, to: Language): Promise<string> {
  const maxLen = 500
  const chunks: string[] = []
  let remaining = text
  while (remaining.length > 0) {
    chunks.push(remaining.slice(0, maxLen))
    remaining = remaining.slice(maxLen)
  }
  const results: string[] = []
  for (const chunk of chunks) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${from.myMemoryCode}|${to.myMemoryCode}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Translation failed (HTTP ${res.status})`)
    const data = (await res.json()) as { responseData?: { translatedText?: string } }
    results.push(data.responseData?.translatedText ?? '')
  }
  return results.join(' ')
}
