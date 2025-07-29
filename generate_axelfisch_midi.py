"""Generate a MIDI file representing the AxelFisch chord progression.
"""

from midiutil import MIDIFile

# Tempo and time signature settings
BPM = 90
TIME_SIGNATURE = (3, 2)  # 3/4 time (numerator=3, denominator=4 -> encoded as 2)

# List of root notes for the 24 chords
ROOT_NOTES = [
    'Eb', 'Bb', 'C', 'Ab', 'F', 'Bb', 'G', 'Ab',
    'C', 'F', 'Bb', 'Ab', 'F', 'Bb', 'Eb', 'Ab',
    'G', 'C', 'Bb', 'Ab', 'F', 'F', 'Bb', 'C'
]

# Mapping from note names to MIDI numbers (starting at C0 = 12)
NOTE_TO_MIDI = {
    'C': 48,   # C3
    'C#': 49, 'Db': 49,
    'D': 50,
    'D#': 51, 'Eb': 51,
    'E': 52,
    'F': 53,
    'F#': 54, 'Gb': 54,
    'G': 55,
    'G#': 56, 'Ab': 56,
    'A': 57,
    'A#': 58, 'Bb': 58,
    'B': 59,
}

# Create the MIDI object
midi = MIDIFile(1)
track = 0
midi.addTempo(track, 0, BPM)

# Add time signature meta event
midi.addTimeSignature(track, 0, TIME_SIGNATURE[0], TIME_SIGNATURE[1], 24)

# Add each root note as a whole note (duration=3 beats in 3/4)
start_time = 0
for note_name in ROOT_NOTES:
    midi_note = NOTE_TO_MIDI[note_name]
    midi.addNote(track, 0, midi_note, start_time, 3, 100)
    start_time += 3

# Write the MIDI file
with open('AxelFisch_Progression.mid', 'wb') as f:
    midi.writeFile(f)
