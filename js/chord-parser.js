// Chord Parser - Converts voice input to musical chord notation
class ChordParser {
    constructor() {
        // French to English note mapping
        this.frenchToEnglish = {
            'do': 'C', 'ré': 'D', 're': 'D', 'mi': 'E', 
            'fa': 'F', 'sol': 'G', 'la': 'A', 'si': 'B'
        };

        // Chord quality mappings
        this.chordQualities = {
            // French
            'majeur': '', 'mineur': 'm', 'septième': '7', 'septieme': '7',
            'majeur sept': 'maj7', 'mineur sept': 'm7',
            'diminué': 'dim', 'diminue': 'dim', 'augmenté': 'aug', 'augmente': 'aug',
            'suspendu deux': 'sus2', 'suspendu quatre': 'sus4',
            'sus deux': 'sus2', 'sus quatre': 'sus4',
            'sixième': '6', 'sixieme': '6', 'neuvième': '9', 'neuvieme': '9',
            // English
            'major': '', 'minor': 'm', 'seventh': '7',
            'major seven': 'maj7', 'major seventh': 'maj7',
            'minor seven': 'm7', 'minor seventh': 'm7',
            'diminished': 'dim', 'augmented': 'aug',
            'suspended two': 'sus2', 'suspended four': 'sus4',
            'sus two': 'sus2', 'sus four': 'sus4',
            'sixth': '6', 'ninth': '9'
        };

        // Alterations
        this.alterations = {
            'dièse': '#', 'diese': '#', 'sharp': '#',
            'bémol': 'b', 'bemol': 'b', 'flat': 'b'
        };

        // Chord to notes mapping (simplified voicings)
        this.chordVoicings = {
            '': ['1', '3', '5'], // Major
            'm': ['1', 'b3', '5'], // Minor
            '7': ['1', '3', '5', 'b7'], // Dominant 7
            'maj7': ['1', '3', '5', '7'], // Major 7
            'm7': ['1', 'b3', '5', 'b7'], // Minor 7
            'dim': ['1', 'b3', 'b5'], // Diminished
            'aug': ['1', '3', '#5'], // Augmented
            'sus2': ['1', '2', '5'], // Suspended 2
            'sus4': ['1', '4', '5'], // Suspended 4
            '6': ['1', '3', '5', '6'], // 6th
            '9': ['1', '3', '5', 'b7', '9'] // 9th
        };

        // Interval to semitone mapping
        this.intervals = {
            '1': 0, 'b2': 1, '2': 2, 'b3': 3, '3': 4,
            '4': 5, 'b5': 6, '5': 7, '#5': 8,
            '6': 9, 'b7': 10, '7': 11, '9': 14
        };
    }

    // Parse voice input to chord symbol
    parseVoiceInput(input) {
        if (!input) return null;

        input = input.toLowerCase().trim();
        
        // Try to parse as chord symbol first (e.g., "C", "Am", "G7")
        const chordSymbolMatch = input.match(/^([a-g][#b]?)([m]?)((?:maj)?[679]?)((?:sus)[24]?)?$/i);
        if (chordSymbolMatch) {
            const root = chordSymbolMatch[1].toUpperCase();
            const quality = chordSymbolMatch[2] + chordSymbolMatch[3] + (chordSymbolMatch[4] || '');
            return {
                root: root,
                quality: quality,
                symbol: root + quality,
                notes: this.getChordNotes(root, quality)
            };
        }

        // Parse natural language input
        let root = null;
        let alteration = '';
        let quality = '';

        // Extract root note
        for (const [french, english] of Object.entries(this.frenchToEnglish)) {
            if (input.includes(french)) {
                root = english;
                input = input.replace(french, '').trim();
                break;
            }
        }

        // If no French note found, look for English note
        if (!root) {
            const englishNoteMatch = input.match(/\b([a-g])\b/i);
            if (englishNoteMatch) {
                root = englishNoteMatch[1].toUpperCase();
                input = input.replace(new RegExp(`\\b${englishNoteMatch[1]}\\b`, 'i'), '').trim();
            }
        }

        if (!root) return null;

        // Extract alteration
        for (const [alt, symbol] of Object.entries(this.alterations)) {
            if (input.includes(alt)) {
                alteration = symbol;
                input = input.replace(alt, '').trim();
                break;
            }
        }

        // Extract chord quality
        let longestMatch = '';
        let matchedQuality = '';
        
        for (const [qualityName, qualitySymbol] of Object.entries(this.chordQualities)) {
            if (input.includes(qualityName) && qualityName.length > longestMatch.length) {
                longestMatch = qualityName;
                matchedQuality = qualitySymbol;
            }
        }

        quality = matchedQuality;

        const fullRoot = root + alteration;
        const chordSymbol = fullRoot + quality;

        return {
            root: fullRoot,
            quality: quality,
            symbol: chordSymbol,
            notes: this.getChordNotes(fullRoot, quality)
        };
    }

    // Get notes for a chord
    getChordNotes(root, quality) {
        const voicing = this.chordVoicings[quality] || this.chordVoicings[''];
        const rootNote = root + '4'; // Default octave
        const notes = [rootNote];

        const baseNoteIndex = this.getNoteIndex(root);
        
        voicing.slice(1).forEach(interval => {
            const semitones = this.intervals[interval];
            const noteIndex = (baseNoteIndex + semitones) % 12;
            const octave = Math.floor((baseNoteIndex + semitones) / 12) + 4;
            const noteName = this.getNoteName(noteIndex);
            notes.push(noteName + octave);
        });

        return notes;
    }

    // Get note index (0-11)
    getNoteIndex(note) {
        const noteIndices = {
            'C': 0, 'C#': 1, 'Db': 1,
            'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4,
            'F': 5, 'F#': 6, 'Gb': 6,
            'G': 7, 'G#': 8, 'Ab': 8,
            'A': 9, 'A#': 10, 'Bb': 10,
            'B': 11
        };
        return noteIndices[note] || 0;
    }

    // Get note name from index
    getNoteName(index) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        return noteNames[index % 12];
    }
}

// Export chord parser instance
window.chordParser = new ChordParser();