import os
import wave
import struct
import math

os.makedirs('static/sounds', exist_ok=True)


def write_sine(path, freq, duration, volume=0.3, sample_rate=44100):
    n_samples = int(sample_rate * duration)
    with wave.open(path, 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        for i in range(n_samples):
            t = i / sample_rate
            value = int(volume * 32767.0 * math.sin(2 * math.pi * freq * t))
            wf.writeframes(struct.pack('<h', value))

# Step sound: short beep
write_sine('static/sounds/step.wav', freq=880, duration=0.15, volume=0.2)

# Finish sound: simple melody (four notes)
with wave.open('static/sounds/finish.wav', 'w') as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(44100)
    sample_rate = 44100
    notes = [(440, 0.18), (660, 0.18), (880, 0.3), (660, 0.3)]
    for freq, duration in notes:
        n = int(sample_rate * duration)
        for i in range(n):
            t = i / sample_rate
            value = int(0.25 * 32767.0 * math.sin(2 * math.pi * freq * t))
            wf.writeframes(struct.pack('<h', value))
