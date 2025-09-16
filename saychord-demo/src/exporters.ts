import { Midi } from '@tonejs/midi'
import { Note as TonalNote } from 'tonal'
import type { Step } from './sequencer'

function subdivisionToQuarters(subdivision: string): number {
	switch (subdivision) {
		case '4n':
			return 1
		case '2n':
			return 2
		case '1m':
			return 4
		default:
			return 1
	}
}

export function stepsToMIDI(steps: Step[], bpm: number, subdivision: string): Blob {
	const midi = new Midi()
	midi.header.setTempo(bpm)
	midi.header.timeSignatures.push({ ticks: 0, timeSignature: [4, 4], measures: 0 })
	const track = midi.addTrack()
	const ppq = midi.header.ppq
	const durQuarters = subdivisionToQuarters(subdivision)
	const durTicks = durQuarters * ppq

	steps.forEach((step, index) => {
		if (!step.active) return
		const startTicks = index * durTicks
		for (const noteName of step.notes) {
			const midiNum = TonalNote.midi(noteName)
			if (midiNum == null) continue
			track.addNote({ midi: midiNum, ticks: startTicks, durationTicks: durTicks, velocity: 0.8 })
		}
	})

	const bytes = midi.toArray()
	return new Blob([new Uint8Array(bytes)], { type: 'audio/midi' })
}

