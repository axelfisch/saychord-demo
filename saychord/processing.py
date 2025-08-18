from __future__ import annotations

import re
from typing import List
from .models import (
    ChordSymbol,
    Block,
    Section,
    Progression,
    Style,
)

ROOT_RE = re.compile(r"^([A-G](?:b|#)?)")
SLASH_RE = re.compile(r"/(.*)$")
EXT_TOKENS = ["#9", "b9", "#11", "b13", "13", "9", "add9"]
QUALITY_TOKENS = [
    "maj7#11",
    "maj7",
    "maj9",
    "maj",
    "m9b5",
    "m11",
    "m9",
    "m7b5",
    "m7",
    "m",
    "13#11",
    "13",
    "7#9",
    "7b9",
    "7alt",
    "7",
    "dim",
    "sus4",
    "alt",
    "add9",
]


def _strip_parentheses(text: str) -> str:
    return text.replace("(", "").replace(")", "")


def normalize_chord_symbol(raw: str) -> ChordSymbol:
    raw = raw.strip()
    raw = _strip_parentheses(raw)
    # parse bass
    bass = None
    m = SLASH_RE.search(raw)
    if m:
        bass = m.group(1)
        raw = raw[: m.start()]

    m = ROOT_RE.match(raw)
    if not m:
        raise ValueError(f"Invalid chord symbol: {raw}")
    root = m.group(1)
    rest = raw[m.end() :]

    quality = None
    for token in QUALITY_TOKENS:
        if rest.startswith(token):
            quality = token
            rest = rest[len(token) :]
            break
    if quality is None:
        quality = rest or "maj"

    # qualities that embed extensions
    embedded_exts: List[str] = []
    if quality in {"7#9", "7b9"}:
        embedded_exts.append(quality[1:])
        quality = "7"
    elif quality == "13#11":
        embedded_exts.append("#11")
        quality = "13"
    elif quality == "maj7#11":
        embedded_exts.append("#11")
        quality = "maj7"

    extensions: List[str] = []
    for token in EXT_TOKENS:
        if token in rest:
            extensions.append(token)
            rest = rest.replace(token, "")
    extensions = embedded_exts + extensions
    return ChordSymbol(root=root, quality=quality, extensions=extensions, bass=bass)


def map_chord_to_style(ch: ChordSymbol, style: Style) -> ChordSymbol:
    allowed = style.available_chords.get(ch.root, [])
    if ch.quality in allowed:
        # some styles encode add9 as quality
        if "add9" in ch.extensions and ch.quality != "add9" and ch.quality not in allowed:
            pass
        return ch

    # handle reductions
    if ch.quality in {"alt", "7alt"}:
        for target in ["7#9", "7b9", "7"]:
            if target in allowed:
                return ChordSymbol(root=ch.root, quality=target, bass=ch.bass, role=ch.role)
    if ch.quality == "maj9":
        if "maj7" in allowed:
            exts = [e for e in ch.extensions if e != "9"]
            if "add9" in allowed:
                exts.append("add9")
            return ChordSymbol(root=ch.root, quality="maj7", extensions=exts, bass=ch.bass, role=ch.role)
        if "maj" in allowed:
            exts = [e for e in ch.extensions if e != "9"]
            if "add9" in allowed:
                exts.append("add9")
            return ChordSymbol(root=ch.root, quality="maj", extensions=exts, bass=ch.bass, role=ch.role)
    if ch.quality == "m9b5" and "m7b5" in allowed:
        return ChordSymbol(root=ch.root, quality="m7b5", bass=ch.bass, role=ch.role)
    if ch.quality == "13#11":
        if "13" in allowed:
            return ChordSymbol(root=ch.root, quality="13", bass=ch.bass, role=ch.role)
        if "maj7" in allowed:
            return ChordSymbol(root=ch.root, quality="maj7", extensions=["#11"], bass=ch.bass, role=ch.role)
    if ch.quality == "maj" and "maj7" in allowed:
        return ChordSymbol(root=ch.root, quality="maj7", extensions=ch.extensions, bass=ch.bass, role=ch.role)
    if ch.quality == "add9" and "maj" in allowed:
        return ChordSymbol(root=ch.root, quality="maj", extensions=["add9"], bass=ch.bass, role=ch.role)

    raise ValueError(f"Chord {ch.to_string()} not available in style {style.id}")


def assign_atr(prog: Progression) -> None:
    for section in prog.sections:
        for block in section.blocks:
            q = block.chord.quality
            if q.startswith("m") and "b5" not in q:
                role = "A"
            elif "7" in q or q in {"13", "dim"}:
                role = "T"
            elif q.startswith("maj") or q == "maj" or q == "add9":
                role = "R"
            else:
                role = "A"
            block.chord.role = role


def suggest_drum_tags(prog: Progression, style: Style) -> None:
    fills = style.drum_grooves.get("fills", [])
    normals = style.drum_grooves.get("normal", [])
    normal_idx = 0
    for i, section in enumerate(prog.sections):
        for block in section.blocks:
            block.drum_tag = None
        if normals:
            for block in section.blocks:
                block.drum_tag = normals[normal_idx % len(normals)]
                normal_idx += 1
        # place fill before chorus/bridge
        if fills and i + 1 < len(prog.sections):
            next_name = prog.sections[i + 1].name.lower()
            if "chorus" in next_name or "bridge" in next_name:
                last_block = section.blocks[-1]
                last_block.drum_tag = fills[0]


def generate_automation(prog: Progression, style: Style) -> dict:
    auto = {"automation": [], "cues": []}
    for i, section in enumerate(prog.sections):
        first_block = section.blocks[0]
        if "chorus" in section.name.lower():
            bar = first_block.bar
            auto["automation"].append({
                "track": "piano",
                "param": "volume",
                "points": [{"bar": bar, "beat": first_block.start_beat, "value": 0.8}],
            })
            auto["automation"].append({
                "track": "pads",
                "param": "volume",
                "points": [{"bar": bar, "beat": first_block.start_beat, "value": 0.7}],
            })
            auto["cues"].append({
                "bar": bar - 1,
                "beat": section.blocks[-1].beats,
                "type": "fill",
                "tag": style.drum_grooves.get("fills", [None])[0],
            })
    return auto


def validate_style(prog: Progression, style: Style) -> None:
    if prog.time_signature != style.time_signature:
        raise ValueError(
            f"Style {style.id} incompatible with time signature {prog.time_signature}"
        )

