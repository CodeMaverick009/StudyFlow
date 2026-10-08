// =========================================================
// STUDYFLOW — WEB AUDIO AMBIENT SOUND GENERATOR
// =========================================================
// Generates procedural ambient sounds (Rain, Waves, White Noise)
// completely using browser AudioContext without external audio files.

let audioCtx = null;
let activeSound = null;
let masterGain = null;
let currentVolume = 0.4;

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
 * Start playing a procedural ambient sound.
 * @param {'rain'|'waves'|'whitenoise'} soundType 
 */
export function playAmbientSound(soundType) {
    initAudioContext();
    if (!audioCtx) return;

    stopAmbientSound();

    if (soundType === "rain") {
        activeSound = createRainSound();
    } else if (soundType === "waves") {
        activeSound = createOceanWavesSound();
    } else if (soundType === "whitenoise") {
        activeSound = createWhiteNoiseSound();
    }
}

export function stopAmbientSound() {
    if (activeSound) {
        if (activeSound.stop) {
            activeSound.stop();
        }
        activeSound = null;
    }
}

export function setAmbientVolume(val) {
    currentVolume = Math.max(0, Math.min(1, parseFloat(val)));
    if (masterGain && audioCtx) {
        masterGain.gain.setValueAtTime(currentVolume, audioCtx.currentTime);
    }
}

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

    // Filter to simulate soft patter of rain
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

    // LFO to modulate wave swells back and forth every ~6 seconds
    const lfo = audioCtx.createOscillator();
    lfo.frequency.setValueAtTime(0.15, audioCtx.currentTime); // 0.15 Hz

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
