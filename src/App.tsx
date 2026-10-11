import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { SUPPORTED_LANGUAGES } from './lib/languages'
import { deleteHistory, getHistory, getSettings, languageByCode, saveHistory, saveSettings, speak, stopSpeaking, translate } from './lib/speech'
import type { Settings } from './lib/speech'
import FloatingHelp from './components/FloatingHelp'
import type { HelpHowTo } from './components/FloatingHelp'

type Status = 'idle' | 'camera' | 'ocr' | 'done' | 'error'

const HELP_HOWTOS: HelpHowTo[] = [
  { title: 'Read text from a photo', body: 'Pick the text language at the top (Arabic is the default), then tap "Start camera", point at the text and tap "Capture & read" — or tap "Upload image" to use a photo. The app recognizes the text, reads it aloud automatically and shows every line as a tappable block.' },
  { title: 'Tap to hear a single line', body: 'After a scan, each recognized line is its own block. Tap any block to hear just that line — useful when the whole text is too long.' },
  { title: 'Translate', body: 'After a scan, pick the language you want under Translate and tap the translate button. The translation appears in a green block and is read aloud. Tap "Read translation" to hear it again.' },
  { title: 'Adjust speed and volume', body: 'The sliders at the top control the reading speed (0.5× to 2×) and volume. They are saved in your browser and applied to everything the app reads.' },
  { title: 'History', body: 'Every scan is saved at the bottom of the page. Tap an entry to open it and hear it again; tap the red ✕ to delete it. The last 50 scans are kept.' },
  { title: 'First use downloads a model', body: 'The first scan in each language downloads an OCR model (10-15 MB) from the internet. After that it is cached and scans are fast — even offline.' },
]

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [settings, setSettings] = useState<Settings>(getSettings())
  const [status, setStatus] = useState<Status>('idle')
  const [text, setText] = useState('')
  const [translated, setTranslated] = useState('')
  const [targetCode, setTargetCode] = useState('en')
  const [translating, setTranslating] = useState(false)
  const [history, setHistory] = useState(getHistory())
  const [error, setError] = useState('')

  const language = languageByCode(settings.languageCode)
  const targetLanguage = languageByCode(targetCode)

  function updateSettings(patch: Partial<Settings>) {
    const next = { ...settings, ...patch }
    setSettings(next)
    saveSettings(next)
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 } },
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setStatus('camera')
    } catch {
      setError('Camera not available. Use "Upload image" instead.')
      setStatus('error')
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  async function runOcr(canvas: HTMLCanvasElement) {
    setStatus('ocr')
    stopCamera()
    stopSpeaking()
    try {
      const result = await window.Tesseract.recognize(canvas, language.tesseractCode)
      const recognized = result.data.text.trim()
      if (!recognized) {
        setError('No text recognized. Try a clearer photo.')
        setStatus('error')
        return
      }
      setText(recognized)
      setTranslated('')
      saveHistory(recognized, language.code)
      setHistory(getHistory())
      speak(recognized, language, settings.rate, settings.volume)
      setStatus('done')
    } catch {
      setError('OCR failed. Please try again.')
      setStatus('error')
    }
  }

  function capture() {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')!.drawImage(video, 0, 0)
    runOcr(canvas)
  }

  function onUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      canvas.getContext('2d')!.drawImage(img, 0, 0)
      runOcr(canvas)
    }
    img.src = URL.createObjectURL(file)
  }

  async function doTranslate() {
    setTranslating(true)
    try {
      const result = await translate(text, language, targetLanguage)
      setTranslated(result)
      speak(result, targetLanguage, settings.rate, settings.volume)
    } catch (err) {
      setError(`Translation failed: ${(err as Error).message}`)
    } finally {
      setTranslating(false)
    }
  }

  function reset() {
    stopSpeaking()
    setText('')
    setTranslated('')
    setError('')
    setStatus('idle')
  }

  const blocks = text.split(/\n+/).filter((b) => b.trim())

  return (
    <div className="app">
      <header className="header">
        <h1>👁️ Help Me Read</h1>
        <p className="subtitle">Capture text, hear it read aloud, translate to 15 languages</p>
      </header>

      <div className="controls">
        <label className="lang-select">
          Text language
          <select value={settings.languageCode} onChange={(e) => updateSettings({ languageCode: e.target.value })}>
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
            ))}
          </select>
        </label>
        <label>
          Speed: {settings.rate.toFixed(1)}×
          <input type="range" min="0.5" max="2" step="0.1" value={settings.rate} onChange={(e) => updateSettings({ rate: Number(e.target.value) })} />
        </label>
        <label>
          Volume: {Math.round(settings.volume * 100)}%
          <input type="range" min="0" max="1" step="0.1" value={settings.volume} onChange={(e) => updateSettings({ volume: Number(e.target.value) })} />
        </label>
      </div>

      {(status === 'idle' || status === 'error') && (
        <div className="actions">
          <button className="primary big" onClick={startCamera}>📷 Start camera</button>
          <label className="primary big upload">
            🖼 Upload image
            <input ref={fileInputRef} type="file" accept="image/*" onChange={onUpload} hidden />
          </label>
          {error && <p className="error">{error}</p>}
        </div>
      )}

      {status === 'camera' && (
        <div className="camera">
          <video ref={videoRef} autoPlay playsInline />
          <div className="actions">
            <button className="primary big" onClick={capture}>📸 Capture & read</button>
            <button className="big" onClick={reset}>Cancel</button>
          </div>
        </div>
      )}

      {status === 'ocr' && <p className="loading big-text">⏳ Reading the image… first use downloads the language model.</p>}

      {status === 'done' && (
        <section className="results">
          <div className="actions">
            <button className="primary big" onClick={() => speak(text, language, settings.rate, settings.volume)}>🔊 Read all</button>
            <button className="big" onClick={stopSpeaking}>⏹ Stop</button>
            <button className="big" onClick={reset}>Scan again</button>
          </div>

          <div className="text-blocks">
            {blocks.map((block, i) => (
              <p
                key={i}
                className="text-block"
                onClick={() => speak(block, language, settings.rate, settings.volume)}
                title="Tap to hear this line"
              >
                {block}
              </p>
            ))}
          </div>

          <div className="translate-box">
            <h2>Translate</h2>
            <div className="actions">
              <select value={targetCode} onChange={(e) => setTargetCode(e.target.value)}>
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                ))}
              </select>
              <button className="primary big" onClick={doTranslate} disabled={translating}>
                {translating ? '⏳ Translating…' : `🌐 Translate to ${targetLanguage.name}`}
              </button>
            </div>
            {translated && (
              <>
                <p className="text-block translated">{translated}</p>
                <button className="big" onClick={() => speak(translated, targetLanguage, settings.rate, settings.volume)}>
                  🔊 Read translation
                </button>
              </>
            )}
          </div>
        </section>
      )}

      <section className="history">
        <h2>History</h2>
        {history.length === 0 && <p className="muted">No scans yet.</p>}
        <ul>
          {[...history].reverse().map((h) => (
            <li key={h.id}>
              <button
                className="history-item"
                onClick={() => {
                  stopSpeaking()
                  setText(h.text)
                  setTranslated('')
                  setStatus('done')
                  speak(h.text, languageByCode(h.language), settings.rate, settings.volume)
                }}
              >
                <span>{new Date(h.timestamp).toLocaleString()}</span>
                <span className="muted">{h.text.slice(0, 60)}…</span>
              </button>
              <button
                className="small danger"
                onClick={() => {
                  deleteHistory(h.id)
                  setHistory(getHistory())
                }}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </section>

      <footer className="footer">Text-to-speech uses your browser's built-in voice. Translation by MyMemory.</footer>
      <FloatingHelp
        rtl={language.code === 'ar' || language.code === 'ur'}
        functions={[
          { label: 'Start camera & read', description: 'Point at any text and capture — the app reads it aloud', action: () => startCamera() },
          { label: 'Upload an image', description: 'Use a photo from your device instead of the camera', action: () => fileInputRef.current?.click() },
          { label: 'Speed & volume', description: 'Adjust the reading voice sliders', action: () => document.querySelector('.controls')?.scrollIntoView({ behavior: 'smooth' }) },
          { label: 'Translate', description: 'Translate the scanned text to any of the 15 languages', action: () => document.querySelector('.translate-box')?.scrollIntoView({ behavior: 'smooth' }) },
          { label: 'History', description: 'Reopen and hear past scans', action: () => document.querySelector('.history')?.scrollIntoView({ behavior: 'smooth' }) },
        ]}
        howtos={HELP_HOWTOS}
      />
    </div>
  )
}
