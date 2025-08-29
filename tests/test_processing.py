import sys
import pathlib

sys.path.append(str(pathlib.Path(__file__).resolve().parents[1]))

from saychord import (
    Style,
    normalize_chord_symbol,
    map_chord_to_style,
    validate_style,
    export_csv_plan,
    Block,
    Section,
    Progression,
)


def load_style(path):
    return Style.load(path)


def test_map_alt_reduction():
    style = load_style('saychord/styles/jazz.vol4.ballad.ecm.4-4.json')
    ch = normalize_chord_symbol('A7alt')
    mapped = map_chord_to_style(ch, style)
    assert mapped.quality == '7b9'


def test_style_signature_lock():
    style = load_style('saychord/styles/jazz.vol4.ballad.ecm.4-4.json')
    prog = Progression(
        title='Waltz',
        style_id='popjazz.valse.3-4',
        time_signature='3/4',
        bpm=84,
        transpose_semitones=0,
        sections=[],
    )
    try:
        validate_style(prog, style)
    except ValueError:
        pass
    else:
        raise AssertionError('Expected ValueError on time signature mismatch')


def test_export_csv_plan():
    style = load_style('saychord/styles/jazz.vol4.ballad.ecm.4-4.json')
    ch = map_chord_to_style(normalize_chord_symbol('Cmaj9'), style)
    block = Block(bar=1, start_beat=1, beats=4, chord=ch)
    section = Section(name='Intro', repeat=1, blocks=[block])
    prog = Progression(
        title='Test',
        style_id=style.id,
        time_signature='4/4',
        bpm=72,
        transpose_semitones=0,
        sections=[section],
    )
    csv = export_csv_plan(prog)
    assert 'Cmaj7add9' in csv
