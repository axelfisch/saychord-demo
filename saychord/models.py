from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any
import json


@dataclass
class ChordSymbol:
    root: str
    quality: str
    extensions: List[str] = field(default_factory=list)
    bass: Optional[str] = None
    degree: Optional[str] = None
    role: Optional[str] = None  # A, T, R

    def to_string(self) -> str:
        ext = ''.join(self.extensions)
        bass_part = f"/{self.bass}" if self.bass else ""
        return f"{self.root}{self.quality}{ext}{bass_part}"


@dataclass
class Block:
    bar: int
    start_beat: int
    beats: int
    chord: ChordSymbol
    drum_tag: Optional[str] = None
    comment: Optional[str] = None


@dataclass
class Section:
    name: str
    repeat: int
    blocks: List[Block]


@dataclass
class Progression:
    title: str
    style_id: str
    time_signature: str
    bpm: int
    transpose_semitones: int
    sections: List[Section]


@dataclass
class Style:
    id: str
    name: str
    time_signature: str
    default_bpm: int
    available_chords: Dict[str, List[str]]
    drum_grooves: Dict[str, List[str]]
    tempo_range: Optional[List[int]] = None
    app_family: Optional[str] = None

    @classmethod
    def from_json(cls, data: Dict[str, Any]) -> "Style":
        return cls(
            id=data["id"],
            name=data.get("name", data["id"]),
            time_signature=data["time_signature"],
            default_bpm=data.get("default_bpm", 120),
            available_chords=data.get("available_chords", {}),
            drum_grooves=data.get("drum_grooves", {}),
            tempo_range=data.get("tempo_range"),
            app_family=data.get("app_family"),
        )

    @classmethod
    def load(cls, path: str) -> "Style":
        with open(path) as fh:
            data = json.load(fh)
        return cls.from_json(data)
