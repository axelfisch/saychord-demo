/**
 * Utilities to transform SayChord sequences into shareable files
 * Supports MIDI, MusicXML and ABC notations so external tools (including GPTs)
 * can download clean representations of dictated chords.
 */
class SequenceExporter {
    constructor() {
        this.noteOffsets = {
            C: 0,
            D: 2,
            E: 4,
            F: 5,
            G: 7,
            A: 9,
            B: 11
        };
    }

    /**
     * Convert current sequence into a simplified structure.
     * @param {Array} sequence - raw sequence from SequenceManager
     * @returns {Array}
     */
    sanitizeSequence(sequence) {
        if (!Array.isArray(sequence)) {
            return [];
        }

        return sequence
            .filter(chord => chord)
            .map((chord, index) => ({
                name: chord.nom || chord.name || `Accord ${index + 1}`,
                notes: Array.isArray(chord.notes) ? chord.notes : [],
                category: chord.categorie || chord.category || 'majeur'
            }));
    }

    /**
     * Create a downloadable MIDI blob from the chord sequence.
     * @param {Array} sequence - sanitized sequence
     * @param {number} tempo - BPM
     * @returns {Blob}
     */
    createMIDI(sequence, tempo = 120) {
        const PPQ = 480;
        const sanitizedSequence = this.sanitizeSequence(sequence);
        if (!sanitizedSequence.length) {
            throw new Error('Séquence vide');
        }

        const microsecondsPerQuarter = Math.round(60000000 / Math.max(tempo, 40));
        const events = [];

        // Tempo meta event
        events.push(...this.writeVariableLength(0), 0xFF, 0x51, 0x03, ...this.numberToBytes(microsecondsPerQuarter, 3));

        sanitizedSequence.forEach((chord, chordIndex) => {
            const midiNotes = chord.notes
                .map(note => this.noteNameToMidi(note))
                .filter(noteNumber => noteNumber !== null);

            if (!midiNotes.length) {
                return;
            }

            // Note on events (play simultaneously)
            midiNotes.forEach((noteNumber, noteIndex) => {
                const delta = (chordIndex === 0 && noteIndex === 0) ? 0 : 0;
                events.push(...this.writeVariableLength(delta), 0x90, noteNumber, 0x60);
            });

            // Note off events after one quarter note
            midiNotes.forEach((noteNumber, noteIndex) => {
                const delta = noteIndex === 0 ? PPQ : 0;
                events.push(...this.writeVariableLength(delta), 0x80, noteNumber, 0x40);
            });
        });

        // End of track
        events.push(...this.writeVariableLength(PPQ), 0xFF, 0x2F, 0x00);

        const trackData = new Uint8Array(events);
        const header = new Uint8Array([
            ...this.stringToBytes('MThd'),
            0x00, 0x00, 0x00, 0x06,
            0x00, 0x01,
            0x00, 0x01,
            0x01, 0xE0 // 480 PPQ
        ]);

        const trackHeader = new Uint8Array([
            ...this.stringToBytes('MTrk'),
            ...this.numberToBytes(trackData.length, 4)
        ]);

        return new Blob([header, trackHeader, trackData], { type: 'audio/midi' });
    }

    /**
     * Build a MusicXML document string for the sequence.
     */
    createMusicXML(sequence, tempo = 120, timeSignature = '4/4') {
        const sanitizedSequence = this.sanitizeSequence(sequence);
        if (!sanitizedSequence.length) {
            throw new Error('Séquence vide');
        }

        const [beats = 4, beatType = 4] = timeSignature.split('/').map(Number);
        const divisions = 1;
        const tempoDirection = `
            <direction>
                <direction-type>
                    <metronome>
                        <beat-unit>quarter</beat-unit>
                        <per-minute>${tempo}</per-minute>
                    </metronome>
                </direction-type>
                <sound tempo="${tempo}"/>
            </direction>
        `;

        const measures = sanitizedSequence.map((chord, index) => {
            const chordRoot = this.getRootFromName(chord.name);
            const pitch = this.getPitchFromNote(chord.notes[0] || chordRoot.step);
            const harmony = `
                <harmony>
                    <root>
                        <root-step>${chordRoot.step}</root-step>
                        ${chordRoot.alter !== 0 ? `<root-alter>${chordRoot.alter}</root-alter>` : ''}
                    </root>
                    <kind>${this.getMusicXMLKind(chord)}</kind>
                </harmony>
            `;

            const attributes = index === 0 ? `
                <attributes>
                    <divisions>${divisions}</divisions>
                    <key>
                        <fifths>${this.keyToFifths(chordRoot.step)}</fifths>
                    </key>
                    <time>
                        <beats>${beats}</beats>
                        <beat-type>${beatType}</beat-type>
                    </time>
                    <clef>
                        <sign>G</sign>
                        <line>2</line>
                    </clef>
                </attributes>
            ` : '';

            const note = `
                <note>
                    <pitch>
                        <step>${pitch.step}</step>
                        ${pitch.alter !== 0 ? `<alter>${pitch.alter}</alter>` : ''}
                        <octave>${pitch.octave}</octave>
                    </pitch>
                    <duration>${divisions}</duration>
                    <type>quarter</type>
                </note>
            `;

            return `
                <measure number="${index + 1}">
                    ${index === 0 ? tempoDirection : ''}
                    ${attributes}
                    ${harmony}
                    ${note}
                </measure>
            `;
        }).join('\n');

        return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>SayChord</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    ${measures}
  </part>
</score-partwise>`;
    }

    /**
     * Build an ABC notation string for the sequence.
     */
    createABC(sequence, tempo = 120, timeSignature = '4/4') {
        const sanitizedSequence = this.sanitizeSequence(sequence);
        if (!sanitizedSequence.length) {
            throw new Error('Séquence vide');
        }

        const root = this.getRootFromName(sanitizedSequence[0].name);
        const chordsLine = sanitizedSequence
            .map(chord => `"${this.formatABCChord(chord.name)}" z`)
            .join(' | ');

        return [
            'X:1',
            'T:SayChord Sequence',
            `M:${timeSignature}`,
            'L:1/4',
            `Q:1/4=${tempo}`,
            `K:${root.step}`,
            chordsLine + ' |'
        ].join('\n');
    }

    /**
     * Download helpers
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    downloadText(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        this.downloadBlob(blob, filename);
    }

    downloadMIDI(sequence, tempo) {
        const blob = this.createMIDI(sequence, tempo);
        this.downloadBlob(blob, this.generateFilename('mid'));
        return blob;
    }

    downloadMusicXML(sequence, tempo, timeSignature) {
        const xml = this.createMusicXML(sequence, tempo, timeSignature);
        this.downloadText(xml, this.generateFilename('musicxml'), 'application/vnd.recordare.musicxml+xml');
        return xml;
    }

    downloadABC(sequence, tempo, timeSignature) {
        const abc = this.createABC(sequence, tempo, timeSignature);
        this.downloadText(abc, this.generateFilename('abc'), 'text/vnd.abc');
        return abc;
    }

    /** Utility helpers **/
    noteNameToMidi(noteName) {
        if (!noteName) return null;
        const match = noteName.trim().match(/^([A-Ga-g])([#b]?)(\d+)?$/);
        if (!match) {
            return null;
        }

        const step = match[1].toUpperCase();
        const accidental = match[2] || '';
        const octave = match[3] !== undefined ? parseInt(match[3], 10) : 4;
        const baseOffset = this.noteOffsets[step];
        const semitone = accidental === '#'
            ? 1
            : accidental.toLowerCase() === 'b'
                ? -1
                : 0;
        return 12 * (octave + 1) + baseOffset + semitone;
    }

    getPitchFromNote(noteName) {
        const match = noteName && noteName.match(/^([A-Ga-g])([#b]?)(\d+)?$/);
        const step = match ? match[1].toUpperCase() : 'C';
        const accidental = match ? match[2] || '' : '';
        const octave = match && match[3] ? parseInt(match[3], 10) : 4;
        const alter = accidental === '#'
            ? 1
            : accidental.toLowerCase() === 'b'
                ? -1
                : 0;
        return { step, alter, octave };
    }

    getRootFromName(name = 'C') {
        const match = name.trim().match(/^([A-Ga-g])([#b]?)/);
        const step = match ? match[1].toUpperCase() : 'C';
        const accidental = match && match[2] ? match[2] : '';
        const alter = accidental === '#'
            ? 1
            : accidental.toLowerCase() === 'b'
                ? -1
                : 0;
        return { step, alter };
    }

    getMusicXMLKind(chord) {
        const category = (chord.category || '').toLowerCase();
        if (category.includes('mineur')) return 'minor';
        if (category.includes('dominant')) return 'dominant';
        if (category.includes('demi')) return 'half-diminished';
        if (category.includes('dim')) return 'diminished';
        if (category.includes('aug')) return 'augmented';
        return 'major';
    }

    keyToFifths(step) {
        const mapping = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, F: -1 };
        return mapping[step] ?? 0;
    }

    formatABCChord(name) {
        return (name || '').replace(/"/g, "'");
    }

    stringToBytes(str) {
        return Array.from(str).map(char => char.charCodeAt(0));
    }

    numberToBytes(value, byteCount) {
        const bytes = new Array(byteCount).fill(0);
        for (let i = byteCount - 1; i >= 0; i -= 1) {
            bytes[i] = value & 0xFF;
            value >>= 8;
        }
        return bytes;
    }

    writeVariableLength(value) {
        let buffer = value & 0x7F;
        const bytes = [];
        while ((value >>= 7)) {
            buffer <<= 8;
            buffer |= ((value & 0x7F) | 0x80);
        }
        while (true) {
            bytes.push(buffer & 0xFF);
            if (buffer & 0x80) {
                buffer >>= 8;
            } else {
                break;
            }
        }
        return bytes;
    }

    generateFilename(extension) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        return `saychord-sequence-${timestamp}.${extension}`;
    }
}

export default SequenceExporter;
