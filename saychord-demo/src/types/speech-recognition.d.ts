// Minimal Web Speech API typings for browsers that expose webkitSpeechRecognition

interface SpeechRecognitionAlternative {
	transcript: string
	confidence: number
}

interface SpeechRecognitionResult {
	readonly length: number
	readonly isFinal: boolean
	[index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionResultList {
	readonly length: number
	[index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionEvent extends Event {
	readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
	readonly error: string
	readonly message: string
}

interface SpeechRecognition extends EventTarget {
	lang: string
	continuous: boolean
	interimResults: boolean
	maxAlternatives: number
	onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
	onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
	onend: ((this: SpeechRecognition, ev: Event) => any) | null
	start(): void
	stop(): void
}

declare var SpeechRecognition: {
	prototype: SpeechRecognition
	new (): SpeechRecognition
}

declare var webkitSpeechRecognition: {
	prototype: SpeechRecognition
	new (): SpeechRecognition
}

interface Window {
	SpeechRecognition?: typeof SpeechRecognition
	webkitSpeechRecognition?: typeof webkitSpeechRecognition
}

