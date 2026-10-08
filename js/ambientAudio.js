// =========================================================
// STUDYFLOW — AMBIENT FOCUS AUDIO PLAYER & GENERATOR
// =========================================================
// Supports high quality MP3 focus tracks and procedural Web Audio fallbacks.

export const AMBIENT_TRACKS = {
    "focus-flow": {
        id: "focus-flow",
        name: "Focus Flow",
        src: "audio/leberch-study-580088.mp3"
    },
    "study-session": {
        id: "study-session",
        name: "Study Session",
        src: "audio/luceris-study-session-602503.mp3"
    },
    "deep-focus": {
        id: "deep-focus",
        name: "Deep Focus",
        src: "audio/the_mountain-study-music-602501.mp3"
    },
    "lofi-focus": {
        id: "lofi-focus",
        name: "Lofi Focus",
        src: "audio/Homepage Music.mp3"
    }
};

// Aliases
AMBIENT_TRACKS["homepage-music"] = AMBIENT_TRACKS["lofi-focus"];

let currentAudio = null;
let currentTrackId = null;
let currentVolume = 0.4;

// Procedural fallback audio context
let audioCtx = null;
let activeProceduralSound = null;
let masterGain = null;

function initAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
            masterGain = audioCtx.createGain();
            masterGain.gain.setValueAtTime(currentVolume, audioCtx.currentTime);
            masterGain.connect(audioCtx.destination);
        }
    }
    if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume();
    }
}

/**
 * Start playing an ambient audio track or procedural sound.
 * @param {'focus-flow'|'study-session'|'deep-focus'|'rain'|'waves'|'whitenoise'} soundType 
 */
export function playAmbientSound(soundType) {
    stopAmbientSound();

    // 1. Play real MP3 track if matched
    if (AMBIENT_TRACKS[soundType]) {
        currentTrackId = soundType;
        const track = AMBIENT_TRACKS[soundType];
        
        currentAudio = new Audio(track.src);
        currentAudio.loop = true;
        currentAudio.volume = currentVolume;
        
        const playPromise = currentAudio.play();
        if (playPromise !== undefined) {
            playPromise.catch(err => {
                console.warn(`Playback prevented or interrupted for "${track.name}":`, err);
            });
        }
        return;
    }

    // 2. Fallback procedural Web Audio generators
    initAudioContext();
    if (!audioCtx) return;

    if (soundType === "rain") {
        activeProceduralSound = createRainSound();
        currentTrackId = soundType;
    } else if (soundType === "waves") {
        activeProceduralSound = createOceanWavesSound();
        currentTrackId = soundType;
    } else if (soundType === "whitenoise") {
        activeProceduralSound = createWhiteNoiseSound();
        currentTrackId = soundType;
    }
}

/**
 * Stop any currently playing ambient sound.
 */
export function stopAmbientSound() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }

    if (activeProceduralSound) {
        if (activeProceduralSound.stop) {
            try {
                activeProceduralSound.stop();
            } catch (e) {
                console.warn(e);
            }
        }
        activeProceduralSound = null;
    }

    currentTrackId = null;
}

/**
 * Adjust the volume of the ambient sound.
 * @param {number|string} val Between 0 and 1
 */
export function setAmbientVolume(val) {
    currentVolume = Math.max(0, Math.min(1, parseFloat(val)));
    
    if (currentAudio) {
        currentAudio.volume = currentVolume;
    }
    
    if (masterGain && audioCtx) {
        masterGain.gain.setValueAtTime(currentVolume, audioCtx.currentTime);
    }
}

/**
 * Return current active track ID.
 */
export function getCurrentTrack() {
    return currentTrackId;
}

// -------------------------------------------------------------
// Procedural Web Audio Generators (Fallbacks)
// -------------------------------------------------------------

function createNoiseBuffer() {
    const bufferSize = audioCtx.sampleRate * 3; // 3 seconds loop buffer
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    return buffer;
}

function createRainSound() {
    const noiseBuffer = createNoiseBuffer();
    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1000, audioCtx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(masterGain);
    whiteNoise.start();

    return {
        stop: () => {
            try { whiteNoise.stop(); } catch(e){}
            whiteNoise.disconnect();
            filter.disconnect();
        }
    };
}

function createOceanWavesSound() {
    const noiseBuffer = createNoiseBuffer();
    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";

    const lfo = audioCtx.createOscillator();
    lfo.frequency.setValueAtTime(0.15, audioCtx.currentTime);

    const lfoGain = audioCtx.createGain();
    lfoGain.gain.setValueAtTime(400, audioCtx.currentTime);

    filter.frequency.setValueAtTime(400, audioCtx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    whiteNoise.connect(filter);
    filter.connect(masterGain);

    whiteNoise.start();
    lfo.start();

    return {
        stop: () => {
            try { whiteNoise.stop(); lfo.stop(); } catch(e){}
            whiteNoise.disconnect();
            lfo.disconnect();
            filter.disconnect();
        }
    };
}

function createWhiteNoiseSound() {
    const noiseBuffer = createNoiseBuffer();
    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, audioCtx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(masterGain);
    whiteNoise.start();

    return {
        stop: () => {
            try { whiteNoise.stop(); } catch(e){}
            whiteNoise.disconnect();
            filter.disconnect();
        }
    };
}
