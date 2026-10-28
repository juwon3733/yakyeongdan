"""야경단 배경음악. 늦여름 항구의 밤, 해 뜨기 전에 탑을 오르는 긴장감.

멜로디 표기: 'a:1.5 f:.5 e d' → 음이름(소문자), #/b 반음, ^ 옥타브 위, _ 아래, ':길이'(박, 기본 1), '-' 쉼표.
화음 진행: ['Dm9', 'Gm7 C', ...] 한 마디에 화음 하나 또는 둘.
지도 곡 셋(map1~3)은 같은 주제를 막마다 조를 올리고 악기를 바꿔 편곡한다.
"""
from synth import (Track, NOTE, chord, root, mel, epiano, bell, bass, pluck_bass, brass, lead, flute, pad, strings,
                   pulse, square, harp, glock)

NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']


def transpose(prog, tp):
    """화음 이름을 tp 반음 옮긴다. 'Am7 E7' 같은 마디도 된다."""
    if not tp:
        return prog
    out = []
    for bar in prog:
        names = []
        for c in bar.split():
            r = c[:2] if len(c) > 1 and c[1] in '#b' else c[:1]
            names.append(NAMES[(NOTE[r] + tp) % 12] + c[len(r):])
        out.append(' '.join(names))
    return out


def melody(tr, bus, inst, bar, bars, octave=5, vel=0.7, legato=0.95, tp=0):
    beat = bar * tr.bpb
    for spec in bars:
        for tok in spec.split():
            name, _, d = tok.partition(':')
            d = float(d) if d else 1.0
            if name != '-':
                tr.note(bus, inst, beat, d * legato, mel(name, octave)[0] + tp, vel)
            beat += d


def chords_per_bar(prog):
    out = []
    for item in prog:
        names = item.split()
        n = len(names)
        out.append([(c, i * 4 / n, 4 / n) for i, c in enumerate(names)])
    return out


def arp(tr, bus, inst, prog, pattern, step=0.5, octave=4, vel=0.5, start_bar=0, dur=None):
    for b, bar in enumerate(chords_per_bar(prog)):
        for name, at, beats in bar:
            notes = chord(name, octave)
            k = 0
            t = 0.0
            while t < beats - 1e-6:
                idx = pattern[k % len(pattern)]
                n = notes[idx % len(notes)] + 12 * (idx // len(notes))
                tr.note(bus, inst, (start_bar + b) * 4 + at + t, dur or step * 1.6, n, vel * (1.0 if k % 4 == 0 else 0.8))
                t += step
                k += 1


def block(tr, bus, inst, prog, hits, octave=4, vel=0.5, start_bar=0, top=None):
    for b, bar in enumerate(chords_per_bar(prog)):
        for name, at, beats in bar:
            notes = chord(name, octave)
            if top:
                notes = notes[:top]
            for h, d in hits:
                if at <= h < at + beats:
                    for n in notes:
                        tr.note(bus, inst, (start_bar + b) * 4 + h, d, n, vel)


def basses(tr, bus, inst, prog, pattern, octave=2, vel=0.8, start_bar=0):
    """pattern: [(박, 길이, 반음 이동)] 를 화음마다 반복"""
    for b, bar in enumerate(chords_per_bar(prog)):
        for name, at, beats in bar:
            r = root(name, octave)
            for h, d, iv in pattern:
                if h < beats:
                    tr.note(bus, inst, (start_bar + b) * 4 + at + h, d, r + iv, vel)


def walking(tr, bus, inst, prog, octave=2, vel=0.75, start_bar=0):
    bars = chords_per_bar(prog)
    flat = [(b, at, beats, name) for b, bar in enumerate(bars) for name, at, beats in bar]
    for i, (b, at, beats, name) in enumerate(flat):
        r = root(name, octave)
        tones = chord(name, octave)
        nxt = root(flat[(i + 1) % len(flat)][3], octave)
        line = [r, tones[2] if len(tones) > 2 else r + 7, tones[1] + (12 if tones[1] < r else 0), nxt + (1 if nxt < r else -1)]
        for k in range(int(beats)):
            n = line[k] if beats >= 4 else ([r, nxt + (1 if nxt < r else -1)][k] if k < 2 else r)
            tr.note(bus, inst, (start_bar + b) * 4 + at + k, 0.9, n, vel * (1 if k == 0 else 0.85))


def drums(tr, bus, pattern, bars, start_bar=0, vel=0.8):
    """pattern: {'kick': [박 또는 (박, 세기)...]} 한 마디 분량"""
    for b in range(bars):
        for kind, beats in pattern.items():
            for x in beats:
                v = x[1] if isinstance(x, tuple) else vel
                at = x[0] if isinstance(x, tuple) else x
                tr.drum(bus, kind, (start_bar + b) * 4 + at, v)


def roll(tr, bus, bar, vel=0.5, start=3.0):
    """마디 끝 스네어 몰아치기"""
    t = start
    while t < 4 - 1e-6:
        tr.drum(bus, 'snare', bar * 4 + t, vel * (0.6 + 0.4 * (t - start)))
        t += 0.25


EIGHTS = [(i * 0.5, 0.45, 12 if i % 2 else 0) for i in range(8)]


# ---------- 타이틀: 바다 위로 솟는 탑 ----------

def title():
    tr = Track(80, 16)
    prog = ['Dm9', 'Bbmaj7', 'Gm9', 'A7sus4 A7', 'Dm9', 'Bbmaj7', 'Gm7 C9', 'Fmaj7 A7'] * 2
    tr.bus('ep', -0.3, 0.5, 0.35); tr.bus('pad', 0, 0.22, 0.55); tr.bus('bass', 0, 0.6, 0.12)
    tr.bus('bell', 0.3, 0.4, 0.5); tr.bus('br', -0.1, 0.36, 0.4); tr.bus('dr', 0.1, 0.4, 0.2)
    arp(tr, 'ep', epiano, prog, [0, 2, 4, 1, 3, 2, 4, 1], step=0.5, octave=4, vel=0.42)
    block(tr, 'pad', pad, prog, [(0, 3.9)], octave=3, vel=0.5, top=3)
    basses(tr, 'bass', bass, prog, [(0, 1.5, 0), (1.5, 0.5, 0), (2, 1.8, 7)], vel=0.65)
    melody(tr, 'bell', bell, 0, ['a:2 d^ e^', 'f^:1.5 e^:.5 d^ c^', 'd^:2 bb a', 'a:3 -',
                                  'a:2 d^ e^', 'f^:1.5 g^:.5 a^ f^', 'g^:1.5 f^:.5 e^ c^', 'e^:2 c#^:2'], octave=5, vel=0.55)
    melody(tr, 'br', brass, 8, ['d^:2 f^ a^', 'g^:1.5 f^:.5 d^ f^', 'bb^:2 a^ g^', 'e^:3 -',
                                 'd^:2 f^ a^', 'd^^:1.5 c^^:.5 a^ f^', 'g^:1.5 a^:.5 bb^ e^', 'f^:2 e^:2'], octave=4, vel=0.5)
    drums(tr, 'dr', {'timp': [(0, 0.35)], 'shaker': [0.5, 1.5, 2.5, 3.5]}, 8, start_bar=8, vel=0.45)
    drums(tr, 'dr', {'kick': [(0, 0.5), (2.5, 0.3)], 'rim': [(3, 0.35)]}, 8, start_bar=8)
    return tr


# ---------- 본부: 등대 아래 쉬는 곳 ----------

def base():
    tr = Track(96, 16, swing=0.3)
    prog = ['Fmaj7', 'Dm7', 'Gm7', 'C7', 'Am7', 'Dm7', 'Gm7 C7', 'Fmaj7',
            'Bbmaj7', 'Am7', 'Gm7', 'C7', 'Fmaj7', 'D7', 'Gm7 C7', 'Fmaj7']
    tr.bus('ep', -0.3, 0.5, 0.25); tr.bus('bass', 0.05, 0.72, 0.08); tr.bus('dr', 0.2, 0.45, 0.15)
    tr.bus('fl', 0.25, 0.48, 0.32); tr.bus('gl', -0.2, 0.32, 0.4)
    block(tr, 'ep', epiano, prog, [(0, 1.2), (1.5, 0.4), (3, 0.7)], octave=4, vel=0.4)
    walking(tr, 'bass', pluck_bass, prog, vel=0.78)
    drums(tr, 'dr', {'brush': [1, 3], 'hat': [(0, 0.45), (1, 0.55), (1.5, 0.3), (2, 0.45), (3, 0.55), (3.5, 0.3)],
                     'kick': [(0, 0.3), (2.5, 0.22)]}, 16)
    melody(tr, 'fl', flute, 0, ['c^:1.5 a:.5 f g', 'a:2 -:1 c^', 'bb:1.5 a:.5 g d^', 'c^:3 -',
                                 'e^:1.5 c^:.5 a g', 'f:2 a c^', 'd^ c^ bb e', 'f:3 -',
                                 'd^:1.5 c^:.5 a f', 'e^:1.5 c^:.5 g:2', 'd^ bb g d', 'e:2 g bb',
                                 'a:1.5 c^:.5 f^ e^', 'f#^:2 d^ c^', 'bb a g e', 'f:4'], octave=4, vel=0.55)
    arp(tr, 'gl', glock, prog[8:], [2, 4, 1, 3], step=1, octave=5, vel=0.3, start_bar=8)
    return tr


# ---------- 지도: 같은 주제, 막마다 다른 편곡 ----------

MAP_A = ['Am', 'F', 'Dm7', 'E7sus4 E7', 'Am', 'Fmaj7', 'Dm7 G', 'Am',
         'Fmaj7', 'G', 'Em7', 'Am', 'Dm7', 'G', 'Cmaj7', 'E7']
MAP_MEL = ['e^:1.5 d^:.5 c^ b', 'a:2 e:2', 'f:1.5 g:.5 a c^', 'b:3 -',
           'e^:1.5 d^:.5 c^ e^', 'a^:2 g^ e^', 'f^:1.5 e^:.5 d^ b', 'a:3 -',
           'c^:2 d^ e^', 'd^:1.5 b:.5 g:2', 'e^ g^ f^ e^', 'e^:3 -',
           'f^:1.5 e^:.5 d^ a', 'b:1.5 c^:.5 d^ b', 'e^:2 c^ g', 'g#:3 -']


def map1():
    """1막 항구층: 물결 같은 하프, 플루트, 느슨한 북"""
    tr = Track(100, 16)
    prog = MAP_A
    tr.bus('harp', -0.35, 0.42, 0.35); tr.bus('fl', 0.2, 0.5, 0.4); tr.bus('bass', 0, 0.62, 0.1)
    tr.bus('pad', 0, 0.16, 0.5); tr.bus('dr', 0.1, 0.38, 0.2)
    arp(tr, 'harp', harp, prog, [0, 1, 2, 4, 2, 1, 0, 2], step=0.5, octave=3, vel=0.5)
    block(tr, 'pad', pad, prog, [(0, 3.9)], octave=3, vel=0.45, top=3)
    basses(tr, 'bass', bass, prog, [(0, 1.4, 0), (1.5, 0.4, 0), (2.5, 1.4, 7)], vel=0.65)
    melody(tr, 'fl', flute, 0, MAP_MEL, octave=4, vel=0.55)
    drums(tr, 'dr', {'shaker': [0.5, 1.5, 2.5, 3.5, (1.75, 0.3), (3.75, 0.3)], 'kick': [(0, 0.4)], 'rim': [(2, 0.3)]}, 16)
    return tr


def map2():
    """2막 구름층: 한 음 올려 현악과 글로켄, 가볍게 뜬 리듬"""
    tp = 2
    tr = Track(108, 16)
    prog = transpose(MAP_A, tp)
    tr.bus('str', -0.2, 0.3, 0.45); tr.bus('gl', 0.35, 0.34, 0.5); tr.bus('ld', 0.1, 0.45, 0.35)
    tr.bus('bass', 0, 0.6, 0.1); tr.bus('dr', 0, 0.42, 0.18)
    block(tr, 'str', strings, prog, [(0, 3.9)], octave=3, vel=0.5, top=3)
    arp(tr, 'gl', glock, prog, [0, 2, 4, 2], step=0.5, octave=5, vel=0.32)
    basses(tr, 'bass', pluck_bass, prog, [(0, 0.8, 0), (1, 0.4, 7), (1.5, 0.8, 12), (3, 0.8, 7)], vel=0.7)
    melody(tr, 'ld', lead, 0, MAP_MEL, octave=4, vel=0.5, tp=tp)
    drums(tr, 'dr', {'kick': [0, 2.5], 'rim': [1, 3], 'hat': [(x * 0.5, 0.35 if x % 2 else 0.5) for x in range(8)]}, 16)
    return tr


def map3():
    """3막 별층: 두 음 더 올려 종소리와 금관, 해가 가까워지는 북"""
    tp = 4
    tr = Track(116, 16)
    prog = transpose(MAP_A, tp)
    tr.bus('bell', 0.3, 0.32, 0.5); tr.bus('br', -0.15, 0.42, 0.35); tr.bus('pad', 0, 0.2, 0.5)
    tr.bus('bass', 0, 0.68, 0.1); tr.bus('dr', 0, 0.48, 0.2); tr.bus('pl', -0.4, 0.18, 0.3)
    arp(tr, 'bell', bell, prog, [0, 2, 4, 1], step=1, octave=5, vel=0.35)
    arp(tr, 'pl', pulse, prog, [0, 1, 2, 4], step=0.25, octave=4, vel=0.35, dur=0.2)
    block(tr, 'pad', strings, prog, [(0, 3.9)], octave=3, vel=0.45, top=3)
    basses(tr, 'bass', bass, prog, EIGHTS, vel=0.6)
    melody(tr, 'br', brass, 0, MAP_MEL, octave=4, vel=0.5, tp=tp)
    drums(tr, 'dr', {'kick': [0, 1.5, 2], 'snare': [(1, 0.5), (3, 0.6)], 'tick': [0.5, 1.5, 2.5, 3.5]}, 16)
    drums(tr, 'dr', {'timp': [(0, 0.4)]}, 4, start_bar=12)
    return tr


# ---------- 전투 ----------

def battle():
    tr = Track(144, 16)
    prog = ['Dm', 'Bb', 'C', 'A7', 'Dm', 'Bb', 'Gm A7', 'Dm',
            'Gm', 'Dm', 'Bb', 'A7', 'Gm', 'Dm', 'Bb C', 'A7']
    tr.bus('br', 0.1, 0.5, 0.25); tr.bus('sq', -0.4, 0.2, 0.2); tr.bus('bass', 0, 0.75, 0.05)
    tr.bus('dr', 0, 0.6, 0.12); tr.bus('str', 0.3, 0.22, 0.3)
    basses(tr, 'bass', bass, prog, EIGHTS, vel=0.75)
    arp(tr, 'sq', pulse, prog, [0, 1, 2, 1], step=0.25, octave=4, vel=0.32, dur=0.18)
    block(tr, 'str', strings, prog, [(0, 1.9), (2, 1.9)], octave=4, vel=0.4, top=3)
    melody(tr, 'br', brass, 0, ['d^:1.5 a:.5 d^ e^', 'f^:1.5 e^:.5 d^ f^', 'e^:1.5 c^:.5 g c^', 'c#^:3 a',
                                 'd^:1.5 a:.5 d^ e^', 'f^:1.5 g^:.5 f^ d^', 'bb:1.5 d^:.5 c#^ e^', 'd^:3 -',
                                 'g^:1.5 f^:.5 d^ bb', 'a:1.5 d^:.5 f^ a^', 'g^:1.5 f^:.5 d^ f^', 'e^:2 c#^:2',
                                 'bb^:1.5 a^:.5 g^ d^', 'f^:1.5 e^:.5 d^ a', 'bb d^ c^ e^', 'e^:2 c#^ a'], octave=4, vel=0.6)
    drums(tr, 'dr', {'kick': [0, 1.5, 2, 3.5], 'snare': [1, 3], 'hat': [(x * 0.5, 0.3 if x % 2 else 0.45) for x in range(8)]}, 16)
    for b in (7, 15):
        roll(tr, 'dr', b, 0.5)
    tr.drum('dr', 'cym', 0, 0.6)
    tr.drum('dr', 'cym', 32, 0.5)
    return tr


def elite():
    tr = Track(150, 16)
    prog = ['Cm', 'Cm', 'Ab', 'Bb', 'Cm', 'Cm', 'Fm', 'G7'] * 2
    tr.bus('br', 0.1, 0.52, 0.25); tr.bus('sq', -0.35, 0.22, 0.2); tr.bus('bass', 0, 0.78, 0.05)
    tr.bus('dr', 0, 0.62, 0.12); tr.bus('pad', 0.3, 0.2, 0.3)
    basses(tr, 'bass', bass, prog, [(0, .45, 0), (.5, .45, 0), (1, .45, 7), (1.5, .45, 0), (2, .45, 12), (2.5, .45, 0), (3, .45, 7), (3.5, .45, 10)], vel=0.8)
    arp(tr, 'sq', square, prog, [0, 2, 1, 2], step=0.25, octave=4, vel=0.3, dur=0.15)
    block(tr, 'pad', strings, prog, [(0, 3.9)], octave=3, vel=0.45, top=3)
    melody(tr, 'br', brass, 0, ['g^:2 eb^ c^', 'd^:1.5 eb^:.5 d^ c^', 'c^:2 eb^ ab^', 'f^:2 d^ bb',
                                 'g^:1.5 g^:.5 ab^ g^', 'eb^:2 c^ g', 'f ab c^ f^', 'b:2 d^ f^',
                                 'eb^:1.5 d^:.5 c^ g', 'eb^:1.5 f^:.5 g^ eb^', 'ab^:2 g^ eb^', 'f^:2 d^ bb',
                                 'c^:1.5 d^:.5 eb^ g^', 'c^^:2 bb^ g^', 'ab^:1.5 g^:.5 f^ c^', 'd^:2 b:2'], octave=4, vel=0.6)
    drums(tr, 'dr', {'kick': [0, 0.5, 2, 2.5], 'snare': [1, 3], 'hat': [x * 0.5 for x in range(8)]}, 16)
    drums(tr, 'dr', {'timp': [(0, 0.55)]}, 16)
    for b in (3, 7, 11, 15):
        roll(tr, 'dr', b, 0.45, 3.5)
    return tr


def boss1():
    """1막 보스 「등대지기」: 돌아가는 등대 불빛 같은 종소리 아르페지오, 무거운 반박자 북"""
    tr = Track(128, 16)
    prog = ['Am', 'Am', 'F', 'F', 'Dm', 'Dm', 'E7', 'E7',
            'Am', 'G', 'F', 'E', 'Dm', 'F', 'E7sus4', 'E7']
    tr.bus('bell', 0.35, 0.34, 0.45); tr.bus('br', -0.1, 0.52, 0.3); tr.bus('org', 0, 0.26, 0.35)
    tr.bus('bass', 0, 0.75, 0.06); tr.bus('dr', 0, 0.6, 0.15)
    arp(tr, 'bell', bell, prog, [0, 1, 2, 4, 2, 1], step=0.25, octave=5, vel=0.3, dur=0.3)
    block(tr, 'org', pad, prog, [(0, 3.9)], octave=3, vel=0.55)
    basses(tr, 'bass', bass, prog, [(0, 1.4, 0), (1.5, 0.4, 0), (2, 0.9, 12), (3, 0.9, 7)], vel=0.8)
    melody(tr, 'br', brass, 0, ['e^:3 c^', 'b:2 a:2', 'c^:3 a', 'f^:2 e^:2',
                                 'd^:3 f^', 'a^:2 f^:2', 'g#^:3 e^', 'b:4',
                                 'a^:2 e^:2', 'g^:2 d^:2', 'f^:2 c^ a', 'g#:4',
                                 'a d^ f^ a^', 'c^^:2 a^:2', 'a^:2 e^:2', 'g#^:4'], octave=4, vel=0.6)
    drums(tr, 'dr', {'kick': [0, 2.5], 'snare': [(2, 0.7)], 'timp': [(0, 0.5)], 'hat': [1, 3]}, 16)
    for b in (7, 15):
        roll(tr, 'dr', b, 0.55)
    return tr


def boss2():
    """2막 보스 「구름 기사단장」: 영웅풍 금관과 스네어 행진"""
    tr = Track(156, 16)
    prog = ['Em', 'C', 'D', 'B7', 'Em', 'C', 'Am B7', 'Em',
            'C', 'D', 'G', 'Em', 'Am', 'D', 'C B7', 'Em']
    tr.bus('br', 0.05, 0.55, 0.28); tr.bus('str', -0.3, 0.3, 0.35); tr.bus('sq', 0.4, 0.18, 0.2)
    tr.bus('bass', 0, 0.75, 0.05); tr.bus('dr', 0, 0.6, 0.14)
    basses(tr, 'bass', bass, prog, EIGHTS, vel=0.72)
    block(tr, 'str', strings, prog, [(0, 1.4), (1.5, 0.4), (2, 1.9)], octave=4, vel=0.42, top=3)
    arp(tr, 'sq', pulse, prog, [0, 2, 1, 2], step=0.25, octave=5, vel=0.25, dur=0.15)
    melody(tr, 'br', brass, 0, ['b:1.5 e^:.5 g^ f#^', 'e^:2 g^:2', 'f#^:1.5 a^:.5 f#^ d^', 'd#^:3 b',
                                 'b:1.5 e^:.5 g^ b^', 'c^^:2 b^ g^', 'a^ e^ f#^ d#^', 'e^:3 -',
                                 'g^:1.5 e^:.5 c^ e^', 'f#^:1.5 a^:.5 d^^ a^', 'b^:2 g^ d^', 'e^:3 b',
                                 'c^ e^ a^ e^', 'd^ f#^ a^ d^^', 'e^:2 d#^:2', 'e^:4'], octave=4, vel=0.6)
    drums(tr, 'dr', {'kick': [0, 2], 'snare': [1, 3, (3.5, 0.4)], 'hat': [x * 0.5 for x in range(8)]}, 16)
    for b in (3, 7, 11, 15):
        roll(tr, 'dr', b, 0.5)
    tr.drum('dr', 'cym', 0, 0.6)
    return tr


def dawn():
    """최종전 「새벽」: 시계 초침 같은 틱, 현악과 금관이 해 뜨듯 밝아진다"""
    tr = Track(140, 16)
    prog = ['F#m', 'D', 'E', 'C#7', 'F#m', 'D', 'Bm C#7', 'F#m',
            'D', 'E', 'A', 'F#m', 'Bm', 'D', 'E', 'C#7']
    tr.bus('br', 0.05, 0.55, 0.3); tr.bus('str', -0.3, 0.34, 0.4); tr.bus('bell', 0.4, 0.3, 0.5)
    tr.bus('bass', 0, 0.75, 0.06); tr.bus('dr', 0, 0.58, 0.15); tr.bus('clk', 0.2, 0.5, 0.1)
    basses(tr, 'bass', bass, prog, EIGHTS, vel=0.72)
    block(tr, 'str', strings, prog, [(0, 3.9)], octave=3, vel=0.5)
    arp(tr, 'bell', bell, prog, [0, 2, 4, 2], step=1, octave=5, vel=0.32)
    melody(tr, 'br', brass, 0, ['c#^:1.5 f#^:.5 a^ g#^', 'f#^:2 d^:2', 'e^:1.5 g#^:.5 b^ e^', 'f^:3 c#^',
                                 'c#^:1.5 f#^:.5 a^ c#^^', 'd^^:2 a^ f#^', 'd^ f#^ f^ g#^', 'f#^:3 -',
                                 'a^:1.5 f#^:.5 d^ f#^', 'g#^:1.5 b^:.5 e^ g#^', 'a^:2 c#^^ e^^', 'f#^:3 c#^',
                                 'd^ f#^ b^ d^^', 'a^:2 f#^ d^', 'g#^ b^ e^^ b^', 'f^:2 g#^:2'], octave=4, vel=0.6)
    melody(tr, 'str', strings, 8, ['f#:2 a:2', 'g#:2 b:2', 'a:2 c#^:2', 'a:4', 'b:2 d^:2', 'a:2 f#:2', 'g#:2 b:2', 'f:2 g#:2'],
           octave=4, vel=0.35)
    drums(tr, 'dr', {'kick': [0, 1.5, 2.5], 'snare': [1, 3]}, 16)
    drums(tr, 'clk', {'tick': [x * 0.5 for x in range(8)]}, 16, vel=0.6)
    drums(tr, 'dr', {'timp': [(0, 0.5), (2, 0.3)]}, 8, start_bar=8)
    roll(tr, 'dr', 15, 0.55, 2.0)
    tr.drum('dr', 'cym', 0, 0.6)
    return tr


# ---------- 끝 ----------

def victory():
    """판 승리·결과(이김): 밝은 금관 팡파르, 반복 가능"""
    tr = Track(120, 8)
    prog = ['C', 'F', 'G', 'C', 'Am', 'F', 'G7', 'C']
    tr.bus('br', 0.05, 0.55, 0.3); tr.bus('str', -0.3, 0.3, 0.4); tr.bus('gl', 0.35, 0.3, 0.45)
    tr.bus('bass', 0, 0.65, 0.08); tr.bus('dr', 0, 0.45, 0.15)
    block(tr, 'str', strings, prog, [(0, 3.9)], octave=4, vel=0.45)
    arp(tr, 'gl', glock, prog, [0, 1, 2, 4], step=0.5, octave=5, vel=0.3)
    basses(tr, 'bass', bass, prog, [(0, 1.4, 0), (1.5, .4, 7), (2, 1.4, 12), (3.5, .4, 7)], vel=0.7)
    melody(tr, 'br', brass, 0, ['g:.5 g:.5 g:.5 c^:2.5', 'a:1.5 c^:.5 f^:2', 'd^:1.5 e^:.5 f^ d^', 'e^:3 -',
                                 'e^:1.5 c^:.5 a e^', 'f^:1.5 e^:.5 d^ c^', 'b d^ g^ f^', 'e^:4'], octave=4, vel=0.6)
    drums(tr, 'dr', {'kick': [0, 2], 'snare': [1, 3], 'hat': [0.5, 1.5, 2.5, 3.5]}, 8)
    tr.drum('dr', 'cym', 0, 0.5)
    return tr


def result():
    """결과(짐)·쉬는 화면: 해 뜬 뒤 조용히 돌아가는 길"""
    tr = Track(72, 8)
    prog = ['Dmaj7', 'Bm7', 'Gmaj7', 'A7sus4 A7'] * 2
    tr.bus('ep', -0.3, 0.5, 0.4); tr.bus('fl', 0.2, 0.48, 0.45); tr.bus('pad', 0, 0.2, 0.55); tr.bus('bass', 0, 0.55, 0.15)
    arp(tr, 'ep', epiano, prog, [0, 2, 3, 4, 3, 2], step=0.5, octave=4, vel=0.4)
    block(tr, 'pad', pad, prog, [(0, 3.9)], octave=3, vel=0.45, top=3)
    basses(tr, 'bass', bass, prog, [(0, 3.8, 0)], vel=0.6)
    melody(tr, 'fl', flute, 0, ['f#^:2 e^ d^', 'b:3 a', 'b:1.5 c#^:.5 d^ g^', 'e^:4',
                                 'f#^:2 a^ f#^', 'd^:3 b', 'g:1.5 a:.5 b d^', 'd^:2 c#^:2'], octave=4, vel=0.52)
    return tr


SONGS = {'title': title, 'base': base, 'map1': map1, 'map2': map2, 'map3': map3, 'battle': battle, 'elite': elite,
         'boss1': boss1, 'boss2': boss2, 'dawn': dawn, 'victory': victory, 'result': result}
