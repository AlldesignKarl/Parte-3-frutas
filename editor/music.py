"""Música lo-fi suave + efectos de sonido, generados por código (sin samples ni voz).
Uso: python3 music.py salida.wav
"""
import sys, wave
import numpy as np

SR = 48000
DUR = 67.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)

BPM = 100
BEAT = 60 / BPM
BAR = 4 * BEAT
T0 = 4.4 - 2 * BAR          # un compás empieza justo en el corte de 4.4 s

def midi(n): return 440 * 2 ** ((n - 69) / 12)

def add(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N or i + len(sig) <= 0: return
    if i < 0: sig = sig[-i:]; i = 0
    sig = sig[:N - i]
    L[i:i + len(sig)] += sig * gain * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(sig)] += sig * gain * np.sqrt(0.5 * (1 + pan))

def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)

def epiano(f, dur=1.6):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + .28 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 3) \
        + .08 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 6)
    s *= 1 + .12 * np.sin(2 * np.pi * 4.5 * t)
    return s * env(n, .006, .9)

def pad(f, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * d * t + p) for d, p in ((1, 0), (1.004, 1), (.996, 2)))
    a = np.minimum(1, t / .6) * np.minimum(1, (dur - t) / .6)
    return s / 3 * a

def pluck(f):
    n = int(.5 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + .3 * np.sin(4 * np.pi * f * t)) * env(n, .003, .12)

def kick():
    n = int(.35 * SR); t = np.arange(n) / SR
    f = 45 + 80 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .002, .14)

def lp(x, a):
    y = np.zeros_like(x); acc = 0.0
    for i, v in enumerate(x): acc += a * (v - acc); y[i] = acc
    return y

def snare():
    n = int(.25 * SR); t = np.arange(n) / SR
    nz = rng.standard_normal(n); nz = nz - lp(nz, .08)
    return (.6 * nz * env(n, .001, .06) + .4 * np.sin(2 * np.pi * 190 * t) * env(n, .001, .05))

def hat():
    n = int(.08 * SR); nz = rng.standard_normal(n); nz = nz - lp(nz, .5)
    return nz * env(n, .0005, .018)

# acordes: Fmaj7 – G6 – Em7 – Am7
chords = [[53, 57, 60, 64], [55, 59, 62, 64], [52, 55, 59, 62], [57, 60, 64, 67]]
roots = [41, 43, 40, 45]

bar = 0
while T0 + bar * BAR < DUR:
    tb = T0 + bar * BAR
    c = chords[bar % 4]; r = roots[bar % 4]
    for k, n in enumerate(c):
        add(epiano(midi(n)), tb + k * .012, .11, (k - 1.5) * .25)
        add(epiano(midi(n)), tb + 2.5 * BEAT + k * .01, .06, (k - 1.5) * .25)
        add(pad(midi(n + 12), BAR + .3), tb, .018, -(k - 1.5) * .3)
    full = 4.4 - .01 <= tb < 65.5
    if full or tb >= 4.4 - BAR:
        for b, g in ((0, 1), (2, .8)):
            add(pad(midi(r - 12), 1.2) * env(int(1.2 * SR), .01, .5), tb + b * BEAT, .25 if full else 0)
    if full:
        groove = not (43.0 <= tb < 45.0)  # pequeña pausa en "¿Cómo es posible?"
        if groove:
            for b in (0, 2.5): add(kick(), tb + b * BEAT, .55)
            add(kick(), tb + 1.75 * BEAT, .3)
            for b in (1, 3): add(snare(), tb + b * BEAT, .22)
        for e in range(8):
            sw = .06 if e % 2 else 0
            add(hat(), tb + (e / 2 + sw) * BEAT, .10 if e % 2 else .14, .3 if e % 2 else -.2)
        arp = [c[0] + 12, c[2] + 12, c[1] + 12, c[3] + 12]
        for e in range(8):
            if e % 3 == 1 or e == 6:
                add(pluck(midi(arp[e % 4])), tb + e / 2 * BEAT, .05, .4)
    bar += 1

# subida antes del primer corte
n = int(1.0 * SR); t = np.arange(n) / SR
nz = rng.standard_normal(n)
riser = (nz - lp(nz, .2)) * (t / 1.0) ** 2
add(riser, 3.4, .12)

# ── efectos ──
def whoosh(d=.5):
    n = int(d * SR); t = np.arange(n) / SR
    nz = rng.standard_normal(n); out = np.zeros(n); acc = 0
    for i in range(n):
        a = .02 + .3 * np.sin(np.pi * t[i] / d) ** 2
        acc += a * (nz[i] - acc); out[i] = acc
    return out * np.sin(np.pi * t / d) ** 1.5 * 2.2

def pop(f=900):
    n = int(.12 * SR); t = np.arange(n) / SR
    fr = f * (1 + 1.2 * np.exp(-t * 60))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * env(n, .001, .03)

def tick():
    n = int(.03 * SR); nz = rng.standard_normal(n); nz = nz - lp(nz, .3)
    return nz * env(n, .0005, .005)

for tc in (4.4, 43.0, 57.0, 62.0): add(whoosh(), tc - .3, .35)
for tc in (10.3, 14.15): add(whoosh(.6), tc, .22)
for tc in (1.4, 8.1, 8.9, 11.45, 11.8, 12.15, 15.6, 24.0, 35.5, 51.3, 52.15, 53.0, 53.85,
           57.7, 58.15, 58.6, 59.2, 63.2, 64.05):
    add(pop(), tc, .16)
add(pop(1300), 6.6, .2)
for tc in (10.05, 26.15, 28.43, 30.525, 31.435, 32.465, 33.535, 36.85, 39.97, 40.97, 42.0):
    add(pop(1600), tc, .09)
for a, b, cps in ((4.85, 6.45, 28), (46.4, 48.8, 30), (64.3, 65.7, 28)):
    tt = a
    while tt < b:
        add(tick(), tt, .05, rng.uniform(-.3, .3)); tt += 1 / cps * rng.uniform(.7, 1.3)

# reverb sencilla (convolución con ruido decreciente)
ir_n = int(1.6 * SR); ti = np.arange(ir_n) / SR
for ch in (L, R):
    ir = rng.standard_normal(ir_n) * np.exp(-ti * 3.2); ir[0] = 0
    wet = np.fft.irfft(np.fft.rfft(ch, 2 ** int(np.ceil(np.log2(N + ir_n)))) *
                       np.fft.rfft(ir, 2 ** int(np.ceil(np.log2(N + ir_n)))))[:N]
    ch += wet * .012

# fundidos y nivel
t = np.arange(N) / SR
fade = np.minimum(1, t / .3) * np.clip((DUR - t) / 2.2, 0, 1)
st = np.stack([L, R], 1) * fade[:, None]
st = np.tanh(st * 1.6) / 1.6
st *= .7 / np.max(np.abs(st))
pcm = (st * 32767).astype(np.int16)
with wave.open(sys.argv[1] if len(sys.argv) > 1 else 'musica.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok')
