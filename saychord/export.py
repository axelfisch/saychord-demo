from __future__ import annotations

from io import BytesIO
from typing import List
from music21 import stream, harmony, meter, tempo, midi

from .models import Progression


def _progression_to_stream(prog: Progression) -> stream.Stream:
    s = stream.Stream()
    s.append(meter.TimeSignature(prog.time_signature))
    s.append(tempo.MetronomeMark(number=prog.bpm))
    for section in prog.sections:
        for block in section.blocks:
            cs = harmony.ChordSymbol(block.chord.to_string())
            cs.quarterLength = block.beats
            s.append(cs)
    return s


def export_csv_plan(prog: Progression) -> str:
    lines: List[str] = ["section,bar,startBeat,beats,chord,drumTag,notes"]
    for section in prog.sections:
        for block in section.blocks:
            chord_str = block.chord.to_string()
            role = block.chord.role or ""
            drum_tag = block.drum_tag or ""
            lines.append(
                f"{section.name},{block.bar},{block.start_beat},{block.beats},\"{chord_str}\",{drum_tag},\"{role}\""
            )
    return "\n".join(lines)


def export_musicxml(prog: Progression) -> bytes:
    s = _progression_to_stream(prog)
    bio = BytesIO()
    s.write("musicxml", fp=bio)
    return bio.getvalue()


def export_midi(prog: Progression) -> bytes:
    s = _progression_to_stream(prog)
    mf = midi.translate.streamToMidiFile(s)
    bio = BytesIO()
    mf.open(bio, "wb")
    mf.write()
    mf.close()
    return bio.getvalue()
