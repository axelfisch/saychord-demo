import { Chord, Note, Interval } from 'tonal'

const FRENCH_TO_PITCH_CLASS: Record<string, string> = {
	'do': 'C',
	're': 'D',
	'ré': 'D',
	'mi': 'E',
	'fa': 'F',
	'sol': 'G',
	'la': 'A',
	'si': 'B',
}

const ACCIDENTAL_WORDS: Record<string, '#' | 'b'> = {
	'dièse': '#',
	'diese': '#',
	'#': '#',
	'bémol': 'b',
	'bemol': 'b',
	'♭': 'b',
	'b': 'b',
}

type Quality = 'maj' | 'm' | '7' | 'maj7' | 'm7' | 'dim' | 'aug' | 'sus2' | 'sus4' | ''

function parseQuality(tokens: string[]): Quality {
	const tokenSet = new Set(tokens)
	if (tokenSet.has('sus2')) return 'sus2'
	if (tokenSet.has('sus4')) return 'sus4'
	if (tokenSet.has('dim') || tokenSet.has('diminué') || tokenSet.has('diminue') || tokenSet.has('diminuee') || tokenSet.has('diminuée') || tokenSet.has('°')) return 'dim'
	if (tokenSet.has('aug') || tokenSet.has('augmenté') || tokenSet.has('augmente') || tokenSet.has('augmentee') || tokenSet.has('augmentée') || tokenSet.has('+')) return 'aug'

	const hasMinor = tokenSet.has('mineur') || tokenSet.has('min') || tokenSet.has('m')
	const hasMajor = tokenSet.has('majeur') || tokenSet.has('maj')
	const has7 = tokenSet.has('7') || tokenSet.has('sept') || tokenSet.has('septieme') || tokenSet.has('septième')

	if (hasMinor && has7) return 'm7'
	if (hasMajor && has7) return 'maj7'
	if (has7) return '7'
	if (hasMinor) return 'm'
	if (hasMajor) return 'maj'
	return ''
}

function normalize(input: string): string {
	return input
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[,;:!\?\.]/g, ' ')
		.toLowerCase()
}

export function parseFrenchChordToSymbol(input: string): string | null {
	const text = normalize(input)
	const rawTokens = text.split(/\s+/).filter(Boolean)
	if (rawTokens.length === 0) return null

	// Remove filler words that ASR might include
	const tokens = rawTokens.filter((t) => !['accord', 'de', 'du', 'la', 'le', 'un', 'une', 'joue', 'jouer'].includes(t))

	// Find tonic and accidental
	let tonicIndex = tokens.findIndex((t) => t in FRENCH_TO_PITCH_CLASS)
	if (tonicIndex === -1) return null
	const tonicWord = tokens[tonicIndex]
	let pitchClass = FRENCH_TO_PITCH_CLASS[tonicWord]

	const accidentalWord = tokens[tonicIndex + 1]
	if (accidentalWord && accidentalWord in ACCIDENTAL_WORDS) {
		pitchClass += ACCIDENTAL_WORDS[accidentalWord]
	}

	const rest = tokens.filter((_, idx) => idx !== tonicIndex && idx !== tonicIndex + 1)
	const quality = parseQuality(rest)

	// Extensions (simple handling)
	let ext = ''
	if (rest.includes('maj7') || (rest.includes('majeur') && (rest.includes('7') || rest.includes('sept') || rest.includes('septieme') || rest.includes('septième')))) {
		ext = 'maj7'
	} else if (rest.includes('m7') || (rest.includes('mineur') && (rest.includes('7') || rest.includes('sept') || rest.includes('septieme') || rest.includes('septième')))) {
		ext = 'm7'
	} else if (rest.includes('7') || rest.includes('sept') || rest.includes('septieme') || rest.includes('septième')) {
		ext = '7'
	} else if (rest.includes('6') || rest.includes('six') || rest.includes('sixte')) {
		ext = '6'
	} else if (rest.includes('9') || rest.includes('neuf') || rest.includes('neuvieme') || rest.includes('neuvième')) {
		ext = '9'
	}

	let symbol = pitchClass
	if (quality === 'maj7' || quality === 'm7' || quality === '7') {
		symbol += quality
	} else if (quality) {
		symbol += quality
	}
	if (ext && !symbol.match(/7|6|9/)) {
		symbol += ext
	}

	return symbol
}

export function voiceChord(symbol: string, baseOctave = 4): string[] | null {
	const data = Chord.get(symbol)
	if (!data || data.empty) return null
	// Use intervals to build from a given root octave, ensuring ascending order
	const rootPc = data.symbol.split(/[^A-G#b]/)[0]
	const root = `${rootPc}${baseOctave}`
	const rootMidi = Note.midi(root)
	if (rootMidi == null) return null
	let currentMidi = rootMidi
	const notes: string[] = []
	for (const interval of data.intervals) {
		const semis = Interval.semitones(interval)
		if (semis == null) continue
		let midi = rootMidi + semis
		while (midi < currentMidi) {
			midi += 12
		}
		currentMidi = midi
		notes.push(Note.fromMidiSharps(midi))
	}
	return notes
}

