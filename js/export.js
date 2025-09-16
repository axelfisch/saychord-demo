// Export Module
class ExportManager {
    constructor() {
        this.midiNoteNumbers = {
            'C': 0, 'C#': 1, 'Db': 1,
            'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4,
            'F': 5, 'F#': 6, 'Gb': 6,
            'G': 7, 'G#': 8, 'Ab': 8,
            'A': 9, 'A#': 10, 'Bb': 10,
            'B': 11
        };
    }

    // Export sequence as text file
    exportAsText(sequence, tempo) {
        if (!sequence || sequence.length === 0) return;

        const date = new Date().toLocaleString('fr-FR');
        let content = `SayChord - Séquence d'accords\n`;
        content += `Date: ${date}\n`;
        content += `Tempo: ${tempo} BPM\n`;
        content += `\n--- Séquence ---\n\n`;
        
        sequence.forEach((chord, index) => {
            content += `${index + 1}. ${chord.symbol}\n`;
        });
        
        content += `\n--- Format simplifié ---\n`;
        content += sequence.map(chord => chord.symbol).join(' - ');
        
        this.downloadFile(content, 'sequence.txt', 'text/plain');
    }

    // Export sequence as MIDI file (simplified version)
    exportAsMidi(sequenceData, tempo) {
        if (!sequenceData || sequenceData.length === 0) return;

        // Create a simple MIDI file structure
        // This is a simplified version - a full implementation would use a proper MIDI library
        const tracks = [];
        
        // Header
        const header = {
            format: 1,
            tracks: 2,
            ticksPerQuarter: 480
        };
        
        // Tempo track
        const tempoTrack = [];
        tempoTrack.push({ time: 0, type: 'tempo', tempo: 60000000 / tempo });
        
        // Note track
        const noteTrack = [];
        let currentTime = 0;
        
        sequenceData.forEach(chordData => {
            chordData.notes.forEach(note => {
                const midiNote = this.noteToMidiNumber(note);
                if (midiNote !== null) {
                    noteTrack.push({
                        time: currentTime,
                        type: 'noteOn',
                        note: midiNote,
                        velocity: 80
                    });
                    noteTrack.push({
                        time: currentTime + (480 * 4), // Whole note duration
                        type: 'noteOff',
                        note: midiNote,
                        velocity: 0
                    });
                }
            });
            currentTime += 480 * 4; // Move to next chord
        });
        
        // Create MIDI data (simplified representation)
        const midiData = this.createSimpleMidiData(header, [tempoTrack, noteTrack]);
        
        // For demo purposes, we'll export as JSON representation
        const jsonData = JSON.stringify({
            format: 'MIDI',
            tempo: tempo,
            sequence: sequenceData.map(chord => ({
                chord: chord.chord,
                notes: chord.notes,
                time: chord.time,
                duration: chord.duration
            }))
        }, null, 2);
        
        this.downloadFile(jsonData, 'sequence.json', 'application/json');
    }

    // Convert note name to MIDI number
    noteToMidiNumber(note) {
        const match = note.match(/^([A-G][#b]?)(\d)$/);
        if (!match) return null;
        
        const noteName = match[1];
        const octave = parseInt(match[2]);
        
        const noteNumber = this.midiNoteNumbers[noteName];
        if (noteNumber === undefined) return null;
        
        return (octave + 1) * 12 + noteNumber;
    }

    // Create simplified MIDI data structure
    createSimpleMidiData(header, tracks) {
        return {
            header: header,
            tracks: tracks,
            info: 'This is a simplified MIDI representation for demo purposes'
        };
    }

    // Download file
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }
}

// Export manager instance
window.exportManager = new ExportManager();