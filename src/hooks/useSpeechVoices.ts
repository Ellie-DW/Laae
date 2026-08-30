import { useEffect, useState } from 'react'
import { canUseSpeechSynthesis, listHuntAlertVoices, type HuntAlertVoiceOption } from '../lib/huntAlert'

export function useSpeechVoices() {
  const [voices, setVoices] = useState<HuntAlertVoiceOption[]>([])

  useEffect(() => {
    if (!canUseSpeechSynthesis()) return

    const update = () => setVoices(listHuntAlertVoices())
    update()
    window.speechSynthesis.addEventListener('voiceschanged', update)
    const retry = window.setTimeout(update, 400)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', update)
      window.clearTimeout(retry)
    }
  }, [])

  return voices
}
