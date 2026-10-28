"""PC-98(YM2608)풍 FM 음원 신시사이저. numpy만 쓴다.

곡은 songs.py, 효과음은 sfx.py에서 쓰고, build.py가 이 모듈로 렌더링해 assets/audio/에 뽑는다.
(「같은 하루, 다른 칸」(game2)의 tools/compose/synth.py에서 가져옴)
"""
import numpy as np

SR = 44100
RNG = np.random.default_rng(7)


def hz(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def env(n, a, d, s, r, hold):
    """ADSR. hold는 건반을 누르고 있는 길이(초). 반환 길이 n."""
    t = np.arange(n) / SR
    e = np.empty(n)
    a = max(a, 1e-4)
    d = max(d, 1e-4)
    att = t < a
    e[att] = t[att] / a
    dec = (t >= a) & (t < hold)
    e[dec] = s + (1 - s) * np.exp(-(t[dec] - a) / d)
    lvl = s + (1 - s) * np.exp(-max(hold - a, 0) / d) if hold > a else min(hold / a, 1)
    rel = t >= hold
    e[rel] = lvl * np.exp(-(t[rel] - hold) / max(r, 1e-4))
    return e


def lowpass(x, fc, order=2):
    """FFT로 부드럽게 깎는 저역 통과."""
    if fc >= SR / 2:
        return x
    X = np.fft.rfft(x, axis=0)
    f = np.fft.rfftfreq(x.shape[0], 1 / SR)
    h = 1 / (1 + (f / fc) ** (2 * order)) ** 0.5
    return np.fft.irfft(X * (h[:, None] if x.ndim > 1 else h), n=x.shape[0], axis=0)


def highpass(x, fc):
    return x - lowpass(x, fc, 1)


# ---------- 악기 ----------
# 각 함수는 (midi, 길이초, 세기) -> 모노 신호. 꼬리(release)를 포함한 길이로 돌려준다.

def fm(n, dur, vel, ratio=1.0, index=2.0, idecay=0.4, a=0.005, d=0.6, s=0.4, r=0.3, fb=0.0, detune=0.0, vib=0.0):
    tail = r * 5
    N = int((dur + tail) * SR)
    t = np.arange(N) / SR
    f = hz(n) * (1 + detune)
    if vib:
        f = f * (1 + vib * np.sin(2 * np.pi * 5.2 * t) * np.clip(t / 0.4, 0, 1))
        ph = 2 * np.pi * np.cumsum(f) / SR
        mph = ph * ratio
    else:
        ph = 2 * np.pi * f * t
        mph = ph * ratio
    I = index * (0.25 + 0.75 * np.exp(-t / max(idecay, 1e-3)))
    m = np.sin(mph + fb * np.sin(mph))
    y = np.sin(ph + I * m)
    return y * env(N, a, d, s, r, dur) * vel


def epiano(n, dur, vel):
    body = fm(n, dur, vel, ratio=1, index=1.6 * vel + 0.4, idecay=0.35, a=0.002, d=1.1, s=0.15, r=0.35)
    tine = fm(n, min(dur, 0.25), vel * 0.18, ratio=14, index=0.6, idecay=0.05, a=0.001, d=0.08, s=0.0, r=0.05)
    out = body
    out[: len(tine)] += tine
    return out


def bell(n, dur, vel):
    return fm(n, dur, vel, ratio=3.5, index=2.2, idecay=0.6, a=0.002, d=1.6, s=0.0, r=0.8)


def bass(n, dur, vel):
    y = fm(n, dur, vel, ratio=1, index=1.4, idecay=0.12, a=0.004, d=0.35, s=0.55, r=0.08, fb=0.3)
    return lowpass(y, 1200)


def pluck_bass(n, dur, vel):
    return lowpass(fm(n, dur, vel, ratio=1, index=2.5, idecay=0.08, a=0.002, d=0.25, s=0.2, r=0.06), 900)


def brass(n, dur, vel):
    y = fm(n, dur, vel, ratio=1, index=2.6, idecay=0.25, a=0.03, d=0.4, s=0.7, r=0.12, fb=0.4, vib=0.004)
    return lowpass(y, 3200)


def lead(n, dur, vel):
    y = fm(n, dur, vel, ratio=2, index=1.1, idecay=0.6, a=0.02, d=0.5, s=0.7, r=0.15, vib=0.006)
    return lowpass(y, 4500)


def flute(n, dur, vel):
    y = fm(n, dur, vel, ratio=1, index=0.35, idecay=1.0, a=0.06, d=0.6, s=0.8, r=0.18, vib=0.007)
    N = len(y)
    breath = lowpass(RNG.standard_normal(N), 3000) * 0.04 * env(N, 0.05, 0.1, 0.3, 0.1, dur)
    return y + breath * vel


def pad(n, dur, vel):
    tail = 1.5
    N = int((dur + tail) * SR)
    t = np.arange(N) / SR
    y = np.zeros(N)
    for dt in (-0.006, 0.0, 0.007):
        ph = (hz(n) * (1 + dt) * t) % 1
        y += 2 * ph - 1
    y = lowpass(y / 3, 1400 + 600 * vel)
    return y * env(N, 0.6, 1.0, 0.8, 0.6, dur) * vel


def strings(n, dur, vel):
    tail = 1.2
    N = int((dur + tail) * SR)
    t = np.arange(N) / SR
    y = np.zeros(N)
    for dt in (-0.004, 0.003, 0.0):
        f = hz(n) * (1 + dt) * (1 + 0.004 * np.sin(2 * np.pi * 5 * t + dt * 900))
        ph = np.cumsum(f) / SR % 1
        y += 2 * ph - 1
    y = lowpass(y / 3, 2600)
    return y * env(N, 0.25, 0.8, 0.85, 0.5, dur) * vel


def square(n, dur, vel, duty=0.5):
    tail = 0.06
    N = int((dur + tail) * SR)
    t = np.arange(N) / SR
    ph = (hz(n) * t) % 1
    y = np.where(ph < duty, 1.0, -1.0)
    y = lowpass(y, 5000)
    return y * env(N, 0.002, 0.15, 0.6, 0.03, dur) * vel * 0.5


def pulse(n, dur, vel):
    return square(n, dur, vel, 0.25)


def harp(n, dur, vel):
    """카플러스-스트롱 대신 감쇠가 빠른 FM 뜯는 소리."""
    return fm(n, dur, vel, ratio=2, index=1.2, idecay=0.08, a=0.001, d=0.6, s=0.0, r=0.4)


def glock(n, dur, vel):
    return fm(n, dur, vel * 0.8, ratio=5.0, index=1.0, idecay=0.2, a=0.001, d=0.9, s=0.0, r=0.6)


# ---------- 타악기 ----------

def kick(vel=1.0):
    N = int(0.45 * SR)
    t = np.arange(N) / SR
    f = 45 + 110 * np.exp(-t / 0.035)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)
    click = RNG.standard_normal(N) * np.exp(-t / 0.004) * 0.3
    return (y + click) * vel


def snare(vel=1.0):
    N = int(0.35 * SR)
    t = np.arange(N) / SR
    tone = np.sin(2 * np.pi * 185 * t) * np.exp(-t / 0.06)
    noise = highpass(RNG.standard_normal(N), 1200) * np.exp(-t / 0.11)
    return (tone * 0.5 + noise * 0.7) * vel


def brush(vel=1.0):
    N = int(0.25 * SR)
    t = np.arange(N) / SR
    noise = lowpass(highpass(RNG.standard_normal(N), 1500), 7000) * np.exp(-t / 0.07) * np.clip(t / 0.01, 0, 1)
    return noise * 0.5 * vel


def hat(vel=1.0, open_=False):
    N = int((0.3 if open_ else 0.08) * SR)
    t = np.arange(N) / SR
    y = highpass(RNG.standard_normal(N), 7000) * np.exp(-t / (0.09 if open_ else 0.018))
    return y * 0.45 * vel


def shaker(vel=1.0):
    N = int(0.09 * SR)
    t = np.arange(N) / SR
    y = highpass(RNG.standard_normal(N), 5000) * np.sin(np.pi * np.clip(t / 0.09, 0, 1)) ** 2
    return y * 0.3 * vel


def rim(vel=1.0):
    N = int(0.08 * SR)
    t = np.arange(N) / SR
    y = (np.sin(2 * np.pi * 1700 * t) + 0.6 * np.sin(2 * np.pi * 820 * t)) * np.exp(-t / 0.012)
    return y * 0.4 * vel


def tick(vel=1.0):
    N = int(0.04 * SR)
    t = np.arange(N) / SR
    return np.sin(2 * np.pi * 3200 * t) * np.exp(-t / 0.006) * 0.35 * vel


def cymbal(vel=1.0):
    N = int(2.0 * SR)
    t = np.arange(N) / SR
    return highpass(RNG.standard_normal(N), 4000) * np.exp(-t / 0.7) * 0.25 * vel


def timpani(vel=1.0, n=38):
    N = int(1.6 * SR)
    t = np.arange(N) / SR
    f = hz(n) * (1 + 0.1 * np.exp(-t / 0.05))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.5)
    y += lowpass(RNG.standard_normal(N), 400) * np.exp(-t / 0.05) * 0.4
    return y * vel


DRUMS = {'kick': kick, 'snare': snare, 'brush': brush, 'hat': hat, 'ohat': lambda v: hat(v, True), 'shaker': shaker,
         'rim': rim, 'tick': tick, 'cym': cymbal, 'timp': timpani}


# ---------- 믹스 ----------

def reverb(x, seconds=2.2, mix=0.25, predelay=0.02, tone=5000, seed=3):
    """지수 감쇠 잡음 임펄스로 FFT 컨볼루션. 스테레오 입력(N,2)."""
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal((n, 2)) * np.exp(-t / (seconds / 6.9))[:, None]
    ir = lowpass(ir, tone)
    pre = int(predelay * SR)
    ir = np.vstack([np.zeros((pre, 2)), ir])
    ir /= np.sqrt((ir ** 2).sum(axis=0))
    L = x.shape[0] + ir.shape[0]
    size = 1 << int(np.ceil(np.log2(L)))
    X = np.fft.rfft(x, size, axis=0)
    H = np.fft.rfft(ir, size, axis=0)
    wet = np.fft.irfft(X * H, size, axis=0)[:L]
    out = np.zeros((L, 2))
    out[: x.shape[0]] += x * (1 - mix * 0.5)
    out += wet * mix
    return out


class Track:
    """한 곡. 박자 단위로 음표를 넣고 render()로 반복 가능한 스테레오 신호를 만든다."""

    def __init__(self, bpm, bars, beats_per_bar=4, swing=0.0):
        self.bpm = bpm
        self.bpb = beats_per_bar
        self.length = bars * beats_per_bar * 60 / bpm
        self.swing = swing
        self.buses = {}

    def t(self, beat):
        # 8분음표 스윙: 뒤쪽 8분을 늦춘다
        if self.swing:
            whole, frac = divmod(beat, 1)
            if abs(frac - 0.5) < 1e-6:
                frac = 0.5 + self.swing * 0.5
            beat = whole + frac
        return beat * 60 / self.bpm

    def bus(self, name, pan=0.0, gain=1.0, verb=0.25):
        if name not in self.buses:
            self.buses[name] = {'sig': np.zeros(int((self.length + 6) * SR)), 'pan': pan, 'gain': gain, 'verb': verb}
        return self.buses[name]

    def add(self, busname, beat, sig, gain=1.0):
        b = self.buses[busname]
        i = int(self.t(beat) * SR)
        end = min(len(b['sig']), i + len(sig))
        b['sig'][i:end] += sig[: end - i] * gain

    def note(self, busname, inst, beat, beats, n, vel=0.8):
        if n is None:
            return
        dur = beats * 60 / self.bpm
        self.add(busname, beat, inst(n, dur, vel))

    def drum(self, busname, kind, beat, vel=0.8):
        self.add(busname, beat, DRUMS[kind](vel))

    def render(self, verb_seconds=2.4, master=0.9):
        N = int(self.length * SR)
        total = max(len(b['sig']) for b in self.buses.values())
        dry = np.zeros((total, 2))
        send = np.zeros((total, 2))
        for b in self.buses.values():
            s = b['sig'] * b['gain']
            p = (b['pan'] + 1) / 2
            st = np.stack([s * np.cos(p * np.pi / 2), s * np.sin(p * np.pi / 2)], axis=1)
            dry += st
            send += st * b['verb']
        wet = reverb(send, verb_seconds, mix=1.0)
        out = np.zeros((max(len(wet), total), 2))
        out[:total] += dry
        out[: len(wet)] += wet
        # 반복: 끝을 넘어간 꼬리를 앞쪽에 겹쳐 이음매를 없앤다
        loop = out[:N].copy()
        tail = out[N:]
        k = 0
        while k < len(tail):
            seg = tail[k:k + N]
            loop[: len(seg)] += seg
            k += N
        loop = highpass(loop, 30)
        # 곡마다 체감 음량을 맞춘다(RMS 기준) → 부드러운 리미터
        rms = np.sqrt(np.mean(loop ** 2)) or 1
        loop = loop / rms * 0.16
        loop = np.tanh(loop * 1.1) / 1.1 * master
        return loop


# ---------- 화음 도우미 ----------

NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
        'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}
QUAL = {'': [0, 4, 7], 'm': [0, 3, 7], '7': [0, 4, 7, 10], 'maj7': [0, 4, 7, 11], 'm7': [0, 3, 7, 10],
        'm7b5': [0, 3, 6, 10], 'dim': [0, 3, 6], 'sus4': [0, 5, 7], 'sus2': [0, 2, 7], 'add9': [0, 4, 7, 14],
        'madd9': [0, 3, 7, 14], '6': [0, 4, 7, 9], 'm6': [0, 3, 7, 9], '9': [0, 4, 7, 10, 14], 'maj9': [0, 4, 7, 11, 14],
        'm9': [0, 3, 7, 10, 14], 'aug': [0, 4, 8], '7sus4': [0, 5, 7, 10], '5': [0, 7, 12]}


def chord(name, octave=4):
    """'Fmaj7' -> 미디 번호 목록 (근음이 octave 옥타브)."""
    root = name[:2] if len(name) > 1 and name[1] in '#b' else name[:1]
    q = name[len(root):]
    if '/' in q:
        q = q.split('/')[0]
    base = 12 * (octave + 1) + NOTE[root]
    return [base + i for i in QUAL[q]]


def root(name, octave=2):
    r = name[:2] if len(name) > 1 and name[1] in '#b' else name[:1]
    if '/' in name:
        r = name.split('/')[1]
    return 12 * (octave + 1) + NOTE[r]


def mel(s, octave=5):
    """'E5 . G . A' 같은 문자열 대신 쓰는 간단 표기: 'e g a+ c^' -> 미디 번호.
    글자=음이름, #/b 반음, ^ 한 옥타브 위, _ 아래, '-' 쉼표(None)."""
    out = []
    for tok in s.split():
        if tok == '-':
            out.append(None)
            continue
        name = tok[0].upper() + (tok[1] if len(tok) > 1 and tok[1] in '#b' else '')
        rest = tok[len(name):]
        o = octave + rest.count('^') - rest.count('_')
        out.append(12 * (o + 1) + NOTE[name])
    return out
