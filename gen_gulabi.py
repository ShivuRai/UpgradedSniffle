import numpy as np
import scipy.io.wavfile as wav
import os

sample_rate = 44100
duration = 1.5
t = np.linspace(0, duration, int(sample_rate * duration), False)

notes = {
    'A3': 220.0,
    'B3': 246.94,
    'C4': 261.63,
    'D4': 293.66,
    'E4': 329.63,
    'F4': 349.23,
    'G4': 392.00,
    'A4': 440.00,
    'B4': 493.88,
    'C5': 523.25,
    'D5': 587.33,
    'E5': 659.25
}

def generate_pluck(f, duration, sample_rate):
    N = int(sample_rate / f)
    buf = np.random.uniform(-1, 1, N)
    out = np.zeros(int(sample_rate * duration))
    
    for i in range(len(out)):
        out[i] = buf[i % N]
        buf[i % N] = 0.996 * 0.5 * (buf[i % N] + buf[(i + 1) % N])
        
    out = out / np.max(np.abs(out))
    envelope = np.exp(-3.5 * t)
    out = out * envelope
    return np.int16(out * 32767)

for name, freq in notes.items():
    audio = generate_pluck(freq, duration, sample_rate)
    wav.write(f'public/{name}.wav', sample_rate, audio)
