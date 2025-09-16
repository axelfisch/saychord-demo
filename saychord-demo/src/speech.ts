export type SpeechState = 'idle' | 'listening' | 'error' | 'unsupported'

export class FrenchSpeechRecognizer {
	private recognition: SpeechRecognition | null = null
	private onResultCb: ((text: string) => void) | null = null
	private onStateCb: ((state: SpeechState) => void) | null = null

	constructor() {
		const SR = (window.SpeechRecognition || window.webkitSpeechRecognition)
		if (!SR) {
			this.recognition = null
			return
		}
		this.recognition = new SR()
		this.recognition.lang = 'fr-FR'
		this.recognition.continuous = false
		this.recognition.interimResults = false
		this.recognition.maxAlternatives = 3
	}

	public setCallbacks(onResult: (text: string) => void, onState: (state: SpeechState) => void) {
		this.onResultCb = onResult
		this.onStateCb = onState
	}

	public start() {
		if (!this.recognition) {
			this.onStateCb?.('unsupported')
			return
		}
		this.onStateCb?.('listening')
		this.recognition.onresult = (e: SpeechRecognitionEvent) => {
			const transcript = Array.from(e.results)
				.map((r: SpeechRecognitionResult) => r[0]?.transcript || '')
				.join(' ')
			this.onResultCb?.(transcript)
			this.onStateCb?.('idle')
		}
		this.recognition.onerror = () => {
			this.onStateCb?.('error')
		}
		this.recognition.onend = () => {
			this.onStateCb?.('idle')
		}
		this.recognition.start()
	}

	public stop() {
		this.recognition?.stop()
	}
}

