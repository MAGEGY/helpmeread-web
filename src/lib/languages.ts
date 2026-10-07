// Ported from HelpMeRead Language.kt
export interface Language {
  code: string
  name: string
  flag: string
  tesseractCode: string
  ttsLocale: string
  myMemoryCode: string
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇬🇧', tesseractCode: 'eng', ttsLocale: 'en-US', myMemoryCode: 'en' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', tesseractCode: 'ara', ttsLocale: 'ar-SA', myMemoryCode: 'ar' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', tesseractCode: 'fra', ttsLocale: 'fr-FR', myMemoryCode: 'fr' },
  { code: 'es', name: 'Español', flag: '🇪🇸', tesseractCode: 'spa', ttsLocale: 'es-ES', myMemoryCode: 'es' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', tesseractCode: 'deu', ttsLocale: 'de-DE', myMemoryCode: 'de' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', tesseractCode: 'hin', ttsLocale: 'hi-IN', myMemoryCode: 'hi' },
  { code: 'zh', name: '中文', flag: '🇨🇳', tesseractCode: 'chi_sim', ttsLocale: 'zh-CN', myMemoryCode: 'zh-CN' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', tesseractCode: 'jpn', ttsLocale: 'ja-JP', myMemoryCode: 'ja' },
  { code: 'ko', name: '한국어', flag: '🇰🇷', tesseractCode: 'kor', ttsLocale: 'ko-KR', myMemoryCode: 'ko' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', tesseractCode: 'rus', ttsLocale: 'ru-RU', myMemoryCode: 'ru' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', tesseractCode: 'ita', ttsLocale: 'it-IT', myMemoryCode: 'it' },
  { code: 'pt', name: 'Português', flag: '🇧🇷', tesseractCode: 'por', ttsLocale: 'pt-BR', myMemoryCode: 'pt' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷', tesseractCode: 'tur', ttsLocale: 'tr-TR', myMemoryCode: 'tr' },
  { code: 'ur', name: 'اردو', flag: '🇵🇰', tesseractCode: 'urd', ttsLocale: 'ur-PK', myMemoryCode: 'ur' },
  { code: 'bn', name: 'বাংলা', flag: '🇧🇩', tesseractCode: 'ben', ttsLocale: 'bn-BD', myMemoryCode: 'bn' },
]

export const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES[1] // Arabic as default

export interface HistoryEntry {
  id: number
  text: string
  language: string
  timestamp: number
}
