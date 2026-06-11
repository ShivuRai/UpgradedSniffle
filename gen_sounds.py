import numpy as np
import scipy.io.wavfile as wav

sample_rate = 44100
duration = 2.0
t = np.linspace(0, duration, int(sample_rate * duration), False)

# E2, A2, D3, G3, B3, E4 frequencies
freqs = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63]

def generate_pluck(f, duration, sample_rate):
    N = int(sample_rate / f)
    # White noise init
    buf = np.random.uniform(-1, 1, N)
    out = np.zeros(int(sample_rate * duration))
    
    # Karplus-Strong
    for i in range(len(out)):
        out[i] = buf[i % N]
        # Lowpass filter the buffer
        buf[i % N] = 0.996 * 0.5 * (buf[i % N] + buf[(i + 1) % N])
    
    # Normalize
    out = out / np.max(np.abs(out))
    # Apply slight decay envelope
    envelope = np.exp(-3.0 * t)
    out = out * envelope
    return np.int16(out * 32767)

for i, freq in enumerate(freqs):
    audio = generate_pluck(freq, duration, sample_rate)
    wav.write(f'public/string-{6-i}.wav', sample_rate, audio)
