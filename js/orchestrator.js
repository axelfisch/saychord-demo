import * as Tone from 'https://cdn.skypack.dev/tone@14.8.39';

const KEY_LABELS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const EXTENSION_LIST = ['', 'maj7', '6', 'sus2', 'sus4', '7', '9', 'm', 'm7', 'm9', 'dim', 'aug'];
const STYLE_LIST = [
    'Axel Fisch',
    'Neo Soul',
    'Cinematic',
    'French House',
    'Synthwave',
    'Lo-Fi',
    'Disco Funk',
    'Afrobeat',
    'Bossa Nova',
    'Ambient',
    'Future Garage'
];
const BASS_LABELS = ['1', 'b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7'];
const BASS_OFFSETS = {
    '1': 0,
    'b2': 1,
    '2': 2,
    'b3': 3,
    '3': 4,
    '4': 5,
    '#4': 6,
    '5': 7,
    'b6': 8,
    '6': 9,
    'b7': 10,
    '7': 11
};

const state = {
    selectedKey: 'C',
    selectedExtension: '',
    selectedBassInversion: '1',
    selectedStyle: STYLE_LIST[0],
    fullChordSymbol: 'C',
    currentChordProgression: [],
    currentSequenceEvents: [],
    bpm: 90,
    rotation: {
        styles: 0,
        keys: 0,
        extensions: 0,
        bass: 0
    }
};

const canvas = document.getElementById('circular-canvas');
const ctx = canvas.getContext('2d');
const center = { x: canvas.width / 2, y: canvas.height / 2 };
const baseStartAngle = -Math.PI / 2;

const rings = [
    {
        id: 'keys',
        radiusInner: 150,
        radiusOuter: 190,
        segmentCount: KEY_LABELS.length,
        labels: KEY_LABELS,
        baseColor: '#0F172A',
        selectedColor: '#22C55E',
        text: { font: '600 16px system-ui', color: '#E5E7EB' }
    },
    {
        id: 'extensions',
        radiusInner: 200,
        radiusOuter: 240,
        segmentCount: EXTENSION_LIST.length,
        labels: EXTENSION_LIST,
        baseColor: '#0B1120',
        selectedColor: '#A855F7',
        text: { font: '500 14px system-ui', color: '#E5E7EB' }
    },
    {
        id: 'bass',
        radiusInner: 250,
        radiusOuter: 290,
        segmentCount: BASS_LABELS.length,
        labels: BASS_LABELS,
        baseColor: '#020617',
        selectedColor: '#22C55E',
        text: { font: '500 14px system-ui', color: '#E5E7EB' }
    },
    {
        id: 'styles',
        radiusInner: 310,
        radiusOuter: 360,
        segmentCount: STYLE_LIST.length,
        labels: STYLE_LIST,
        text: {
            font: '700 16px system-ui',
            unselectedColor: '#60A5FA',
            selectedColor: '#FFFFFF'
        },
        glow: {
            unselected: { shadowColor: 'rgba(96,165,250,0.9)', shadowBlur: 15 },
            selected: { shadowColor: 'rgba(191,219,254,1)', shadowBlur: 22 }
        },
        background: {
            selected: { from: '#0EA5E9', to: '#3B82F6' }
        }
    }
];

const rotationButtons = document.querySelectorAll('.rotate-button');
const bpmSlider = document.getElementById('bpm-slider');
const bpmValue = document.getElementById('bpm-value');
const playButton = document.getElementById('play-progression');
const stopButton = document.getElementById('stop-playback');
const generateButton = document.getElementById('generate-axel-progression');
const progressionList = document.getElementById('progression-list');
const rotationDisplays = {
    styles: document.querySelector('[data-bind-rotation="styles"]'),
    keys: document.querySelector('[data-bind-rotation="keys"]'),
    extensions: document.querySelector('[data-bind-rotation="extensions"]'),
    bass: document.querySelector('[data-bind-rotation="bass"]')
};

const bindings = Array.from(document.querySelectorAll('[data-bind]'));

let synth = null;
let transportStarted = false;

function updateBindings() {
    bindings.forEach((el) => {
        const key = el.getAttribute('data-bind');
        let value = state[key];
        if (key === 'selectedExtension' && value === '') {
            value = '—';
        }
        if (key === 'selectedBassInversion' && (!value || value === '1')) {
            value = value === '1' ? 'Root' : '—';
        }
        el.textContent = value;
    });
    state.fullChordSymbol = buildChordSymbol(state.selectedKey, state.selectedExtension, state.selectedBassInversion);
    const fullChordBinding = bindings.find((el) => el.getAttribute('data-bind') === 'fullChordSymbol');
    if (fullChordBinding) {
        fullChordBinding.textContent = state.fullChordSymbol;
    }
}

function updateRotationDisplays() {
    Object.entries(state.rotation).forEach(([key, value]) => {
        const deg = (normalizeAngle(value) * 180) / Math.PI;
        const display = rotationDisplays[key];
        if (display) {
            display.textContent = `${deg.toFixed(0)}°`;
        }
    });
}

function normalizeAngle(angle) {
    const tau = Math.PI * 2;
    return ((angle % tau) + tau) % tau;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackgroundRings();
    drawRings();
    drawCenter();
}

function drawBackgroundRings() {
    const gradient = ctx.createRadialGradient(center.x, center.y, 40, center.x, center.y, 360);
    gradient.addColorStop(0, '#0F172A');
    gradient.addColorStop(0.65, '#020617');
    gradient.addColorStop(1, '#020617');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(center.x, center.y, 360, 0, Math.PI * 2);
    ctx.fill();
}

function drawRings() {
    rings.forEach((ring) => {
        const segmentAngle = (Math.PI * 2) / ring.segmentCount;
        const rotation = state.rotation[ring.id === 'bass' ? 'bass' : ring.id] || 0;
        for (let i = 0; i < ring.segmentCount; i++) {
            const label = ring.labels[i] || '';
            const start = baseStartAngle + rotation + i * segmentAngle;
            const end = start + segmentAngle;
            const isSelected = isSegmentSelected(ring, label);

            ctx.beginPath();
            ctx.arc(center.x, center.y, ring.radiusOuter, start, end);
            ctx.arc(center.x, center.y, ring.radiusInner, end, start, true);
            ctx.closePath();

            if (ring.id === 'styles') {
                if (isSelected) {
                    const gradient = ctx.createLinearGradient(
                        center.x + Math.cos(start) * ring.radiusInner,
                        center.y + Math.sin(start) * ring.radiusInner,
                        center.x + Math.cos(end) * ring.radiusOuter,
                        center.y + Math.sin(end) * ring.radiusOuter
                    );
                    gradient.addColorStop(0, ring.background.selected.from);
                    gradient.addColorStop(1, ring.background.selected.to);
                    ctx.fillStyle = gradient;
                    ctx.shadowColor = ring.glow.selected.shadowColor;
                    ctx.shadowBlur = ring.glow.selected.shadowBlur;
                } else {
                    ctx.fillStyle = 'rgba(14, 165, 233, 0.08)';
                    ctx.shadowColor = ring.glow.unselected.shadowColor;
                    ctx.shadowBlur = ring.glow.unselected.shadowBlur;
                }
            } else {
                ctx.fillStyle = isSelected && ring.selectedColor ? ring.selectedColor : ring.baseColor;
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
            }

            ctx.fill();

            if (ring.id !== 'styles') {
                ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            ctx.shadowBlur = 0;
            drawRingLabel(ring, label, start, segmentAngle, isSelected);
        }
    });
}

function drawRingLabel(ring, label, start, segmentAngle, isSelected) {
    const angle = start + segmentAngle / 2;
    const radius = (ring.radiusInner + ring.radiusOuter) / 2;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (ring.id === 'styles') {
        ctx.font = ring.text.font;
        ctx.fillStyle = isSelected ? ring.text.selectedColor : ring.text.unselectedColor;
        ctx.fillText(label, 0, 0);
    } else {
        ctx.font = ring.text.font;
        ctx.fillStyle = ring.text.color;
        ctx.fillText(label || '•', 0, 0);
    }

    ctx.restore();
}

function drawCenter() {
    const radius = 120;
    const gradient = ctx.createRadialGradient(center.x, center.y, 20, center.x, center.y, radius);
    gradient.addColorStop(0, '#0F172A');
    gradient.addColorStop(1, '#020617');

    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#38BDF8';
    ctx.stroke();

    ctx.fillStyle = '#E5E7EB';
    ctx.font = '600 18px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('KEY', center.x, center.y - 40);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 48px system-ui';
    ctx.fillText(state.selectedKey, center.x, center.y + 10);

    ctx.fillStyle = '#A5B4FC';
    ctx.font = '400 20px system-ui';
    const extText = state.selectedExtension || 'Natural';
    ctx.fillText(extText, center.x, center.y + 44);
}

function isSegmentSelected(ring, label) {
    switch (ring.id) {
        case 'keys':
            return label === state.selectedKey;
        case 'extensions':
            return label === state.selectedExtension;
        case 'bass':
            return label === state.selectedBassInversion;
        case 'styles':
            return label === state.selectedStyle;
        default:
            return false;
    }
}

function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const dx = x - center.x;
    const dy = y - center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    for (const ring of rings) {
        if (distance >= ring.radiusInner && distance <= ring.radiusOuter) {
            const segmentAngle = (Math.PI * 2) / ring.segmentCount;
            const rotation = state.rotation[ring.id === 'bass' ? 'bass' : ring.id] || 0;
            const adjusted = normalizeAngle(angle - baseStartAngle - rotation);
            const index = Math.floor(adjusted / segmentAngle);
            const label = ring.labels[index];
            applySelection(ring.id, label);
            return;
        }
    }
}

function applySelection(ringId, label) {
    if (label === undefined || label === null) return;
    switch (ringId) {
        case 'keys':
            state.selectedKey = label;
            break;
        case 'extensions':
            state.selectedExtension = label;
            break;
        case 'bass':
            state.selectedBassInversion = label;
            break;
        case 'styles':
            state.selectedStyle = label;
            break;
        default:
            break;
    }
    updateBindings();
    draw();
}

function rotate(target, delta) {
    state.rotation[target] = normalizeAngle(state.rotation[target] + delta);
    updateRotationDisplays();
    draw();
}

function buildChordSymbol(key, extension, bass) {
    const ext = extension || '';
    const bassSuffix = bass && bass !== '1' ? `/${transposeKey(key, BASS_OFFSETS[bass])}` : '';
    return `${key}${ext}${bassSuffix}`;
}

function transposeKey(key, semitoneOffset) {
    const baseIndex = KEY_LABELS.indexOf(key);
    if (baseIndex === -1) {
        return key;
    }
    const newIndex = (baseIndex + semitoneOffset + KEY_LABELS.length) % KEY_LABELS.length;
    return KEY_LABELS[newIndex];
}

function chordIntervals(extension) {
    switch (extension) {
        case 'maj7':
            return [0, 4, 7, 11];
        case '6':
            return [0, 4, 7, 9];
        case 'sus2':
            return [0, 2, 7];
        case 'sus4':
            return [0, 5, 7];
        case '7':
            return [0, 4, 7, 10];
        case '9':
            return [0, 4, 7, 10, 14];
        case 'add9':
            return [0, 4, 7, 14];
        case 'm':
            return [0, 3, 7];
        case 'm7':
            return [0, 3, 7, 10];
        case 'm9':
            return [0, 3, 7, 10, 14];
        case 'dim':
            return [0, 3, 6, 9];
        case 'aug':
            return [0, 4, 8];
        case '13':
            return [0, 4, 7, 10, 14, 21];
        default:
            return [0, 4, 7];
    }
}

function generateChordNotes(key, extension, bass = '1') {
    const midiRoot = 60; // C4
    const keyIndex = KEY_LABELS.indexOf(key);
    const baseOffset = keyIndex >= 0 ? keyIndex : 0;
    const root = midiRoot + baseOffset;
    const intervals = chordIntervals(extension);
    const notes = intervals.map((interval) => Tone.Frequency((root + interval), 'midi').toNote());

    const bassOffset = BASS_OFFSETS[bass];
    if (typeof bassOffset === 'number') {
        const bassNoteMidi = 48 + ((baseOffset + bassOffset) % 12);
        notes.unshift(Tone.Frequency(bassNoteMidi, 'midi').toNote());
    }
    return [...new Set(notes)];
}

function progressionForStyle(baseKey, style, extension) {
    const patterns = {
        'Axel Fisch': [
            { semitone: 0, extension: extension || 'maj7' },
            { semitone: 5, extension: 'm7' },
            { semitone: 7, extension: '9' },
            { semitone: 10, extension: '7' }
        ],
        'Neo Soul': [
            { semitone: 0, extension: 'maj7' },
            { semitone: 3, extension: 'm9' },
            { semitone: 5, extension: 'm7' },
            { semitone: 10, extension: '7' }
        ],
        'Cinematic': [
            { semitone: 0, extension: 'maj7' },
            { semitone: 2, extension: 'sus2' },
            { semitone: 7, extension: '9' },
            { semitone: 9, extension: '6' }
        ],
        'French House': [
            { semitone: 0, extension: '7' },
            { semitone: 7, extension: '7' },
            { semitone: 9, extension: '6' },
            { semitone: 2, extension: '9' }
        ],
        'Synthwave': [
            { semitone: 0, extension: 'maj7' },
            { semitone: 7, extension: 'sus2' },
            { semitone: 9, extension: '6' },
            { semitone: 4, extension: 'aug' }
        ],
        'Lo-Fi': [
            { semitone: 0, extension: 'm7' },
            { semitone: 5, extension: 'm9' },
            { semitone: 7, extension: 'sus2' },
            { semitone: 10, extension: '7' }
        ],
        'Disco Funk': [
            { semitone: 0, extension: '9' },
            { semitone: 7, extension: '13' },
            { semitone: 5, extension: '7' },
            { semitone: 10, extension: '7' }
        ],
        'Afrobeat': [
            { semitone: 0, extension: '9' },
            { semitone: 2, extension: '7' },
            { semitone: 7, extension: 'sus4' },
            { semitone: 9, extension: '6' }
        ],
        'Bossa Nova': [
            { semitone: 0, extension: 'maj7' },
            { semitone: 5, extension: '7' },
            { semitone: 7, extension: '9' },
            { semitone: 11, extension: 'dim' }
        ],
        'Ambient': [
            { semitone: 0, extension: 'add9' },
            { semitone: 7, extension: 'sus2' },
            { semitone: 5, extension: 'maj7' },
            { semitone: 9, extension: '6' }
        ],
        'Future Garage': [
            { semitone: 0, extension: 'm9' },
            { semitone: 3, extension: 'm7' },
            { semitone: 10, extension: '7' },
            { semitone: 5, extension: 'sus2' }
        ]
    };
    const pattern = patterns[style] || patterns['Axel Fisch'];
    return pattern.map((step) => {
        const chordExtension = step.extension || extension;
        const transpose = typeof step.semitone === 'number' ? step.semitone : 0;
        const chordKey = transposeKey(baseKey, transpose);
        return {
            key: chordKey,
            extension: chordExtension,
            bass: state.selectedBassInversion
        };
    });
}

function ensureSynth() {
    if (synth) {
        return synth;
    }
    synth = new Tone.PolySynth(Tone.Synth).toDestination();
    synth.set({ volume: -8 });
    return synth;
}

async function playProgression() {
    if (!transportStarted) {
        await Tone.start();
        transportStarted = true;
    }
    ensureSynth();

    const progression = state.currentChordProgression.length > 0
        ? state.currentChordProgression
        : [{ key: state.selectedKey, extension: state.selectedExtension, bass: state.selectedBassInversion }];

    if (!state.currentChordProgression.length) {
        state.currentChordProgression = progression;
    }

    const events = buildNoteEvents(progression);
    state.currentSequenceEvents = events;
    renderProgression();

    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = state.bpm;

    events.forEach((event) => {
        const time = event.time * (60 / state.bpm);
        Tone.Transport.schedule((transportTime) => {
            synth.triggerAttackRelease(event.notes, event.duration * (60 / state.bpm), transportTime, event.velocity);
        }, time);
    });

    Tone.Transport.start('+0.05');
}

function stopPlayback() {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    if (synth) {
        synth.releaseAll();
    }
}

function buildNoteEvents(progression) {
    const events = [];
    let currentTime = 0;
    progression.forEach((chord, index) => {
        const extension = chord.extension || state.selectedExtension;
        const notes = generateChordNotes(chord.key, extension, chord.bass);
        const duration = 1; // beats
        events.push({
            id: `${index}-${chord.key}`,
            chord: `${chord.key}${extension}`,
            notes,
            time: currentTime,
            duration,
            velocity: 0.85
        });
        currentTime += duration;
    });
    return events;
}

function renderProgression() {
    progressionList.innerHTML = '';
    if (!state.currentChordProgression.length) {
        const li = document.createElement('li');
        li.classList.add('empty');
        li.textContent = 'Aucune progression générée';
        progressionList.appendChild(li);
        return;
    }

    state.currentChordProgression.forEach((step, index) => {
        const li = document.createElement('li');
        const chord = `${step.key}${step.extension || ''}`;
        li.innerHTML = `<span class="chord">${chord}</span><span class="time">${index + 1}</span>`;
        progressionList.appendChild(li);
    });
}

function generateProgression() {
    const progression = progressionForStyle(state.selectedKey, state.selectedStyle, state.selectedExtension);
    state.currentChordProgression = progression;
    state.currentSequenceEvents = buildNoteEvents(progression);
    renderProgression();
    updateBindings();
}

function registerEvents() {
    canvas.addEventListener('click', handleCanvasClick);

    rotationButtons.forEach((button) => {
        const action = button.dataset.action;
        button.addEventListener('click', () => {
            const delta = action.includes('Left') ? segmentAngleFor(action) : -segmentAngleFor(action);
            const target = action.replace('rotate', '').replace('Left', '').replace('Right', '').toLowerCase();
            rotate(target, delta);
        });
    });

    bpmSlider.addEventListener('input', (event) => {
        state.bpm = Number(event.target.value);
        bpmValue.textContent = state.bpm;
    });

    playButton.addEventListener('click', playProgression);
    stopButton.addEventListener('click', stopPlayback);
    generateButton.addEventListener('click', generateProgression);
}

function segmentAngleFor(action) {
    if (action.includes('Styles')) {
        return (Math.PI * 2) / STYLE_LIST.length;
    }
    if (action.includes('Keys')) {
        return (Math.PI * 2) / KEY_LABELS.length;
    }
    if (action.includes('Extensions')) {
        return (Math.PI * 2) / EXTENSION_LIST.length;
    }
    if (action.includes('Bass')) {
        return (Math.PI * 2) / BASS_LABELS.length;
    }
    return 0;
}

updateBindings();
updateRotationDisplays();
renderProgression();
registerEvents();
draw();
