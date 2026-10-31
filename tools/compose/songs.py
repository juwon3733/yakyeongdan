"""야경단 배경음악. 늦여름 항구의 밤, 해 뜨기 전에 탑을 오르는 긴장감.

멜로디 표기: 'a:1.5 f:.5 e d' → 음이름(소문자), #/b 반음, ^ 옥타브 위, _ 아래, ':길이'(박, 기본 1), '-' 쉼표.
화음 진행: ['Dm9', 'Gm7 C', ...] 한 마디에 화음 하나 또는 둘.
지도 곡 셋(map1~3)은 같은 주제를 막마다 조를 올리고 악기를 바꿔 편곡한다.
"""
from synth import (Track, NOTE, chord, root, mel, epiano, bell, bass, pluck_bass, brass, lead, flute, pad, strings,
                   pulse, square, harp, glock, fm, lowpass)

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

BATTLE_PROG = ['Dm', 'Bb', 'C', 'A7', 'Dm', 'Bb', 'Gm A7', 'Dm',
               'Gm', 'Dm', 'Bb', 'A7', 'Gm', 'Dm', 'Bb C', 'A7']
BATTLE_MEL = ['d^:1.5 a:.5 d^ e^', 'f^:1.5 e^:.5 d^ f^', 'e^:1.5 c^:.5 g c^', 'c#^:3 a',
              'd^:1.5 a:.5 d^ e^', 'f^:1.5 g^:.5 f^ d^', 'bb:1.5 d^:.5 c#^ e^', 'd^:3 -',
              'g^:1.5 f^:.5 d^ bb', 'a:1.5 d^:.5 f^ a^', 'g^:1.5 f^:.5 d^ f^', 'e^:2 c#^:2',
              'bb^:1.5 a^:.5 g^ d^', 'f^:1.5 e^:.5 d^ a', 'bb d^ c^ e^', 'e^:2 c#^ a']


def battle():
    """1막 항구층 전투 (에피소드 특별 전투도 이 곡): 금관 주제, 펄스 아르페지오, 곧은 8비트"""
    tr = Track(144, 16)
    prog = BATTLE_PROG
    tr.bus('br', 0.1, 0.5, 0.25); tr.bus('sq', -0.4, 0.2, 0.2); tr.bus('bass', 0, 0.75, 0.05)
    tr.bus('dr', 0, 0.6, 0.12); tr.bus('str', 0.3, 0.22, 0.3)
    basses(tr, 'bass', bass, prog, EIGHTS, vel=0.75)
    arp(tr, 'sq', pulse, prog, [0, 1, 2, 1], step=0.25, octave=4, vel=0.32, dur=0.18)
    block(tr, 'str', strings, prog, [(0, 1.9), (2, 1.9)], octave=4, vel=0.4, top=3)
    melody(tr, 'br', brass, 0, BATTLE_MEL, octave=4, vel=0.6)
    drums(tr, 'dr', {'kick': [0, 1.5, 2, 3.5], 'snare': [1, 3], 'hat': [(x * 0.5, 0.3 if x % 2 else 0.45) for x in range(8)]}, 16)
    for b in (7, 15):
        roll(tr, 'dr', b, 0.5)
    tr.drum('dr', 'cym', 0, 0.6)
    tr.drum('dr', 'cym', 32, 0.5)
    return tr


def battle2():
    """2막 구름층 전투: 한 음 올려 FM 리드(+옥타브 위 글로켄 겹침), 뜯는 베이스, 엇박 당김 리듬"""
    tp = 2
    tr = Track(152, 16)
    prog = transpose(BATTLE_PROG, tp)
    tr.bus('ld', 0.1, 0.46, 0.3); tr.bus('gl', 0.4, 0.2, 0.45); tr.bus('sq', -0.4, 0.2, 0.25)
    tr.bus('bass', 0, 0.72, 0.05); tr.bus('dr', 0, 0.58, 0.14); tr.bus('ep', -0.25, 0.3, 0.3)
    basses(tr, 'bass', pluck_bass, prog, [(0, .4, 0), (.75, .4, 12), (1.5, .4, 0), (2, .4, 7), (2.75, .4, 12), (3.5, .4, 10)], vel=0.8)
    arp(tr, 'sq', square, prog, [0, 2, 4, 2, 1, 2, 4, 2], step=0.25, octave=4, vel=0.26, dur=0.14)
    block(tr, 'ep', epiano, prog, [(0, 0.4), (1.5, 0.4), (2.5, 0.4), (3.5, 0.4)], octave=4, vel=0.45, top=3)
    melody(tr, 'ld', lead, 0, BATTLE_MEL, octave=4, vel=0.6, tp=tp)
    melody(tr, 'gl', glock, 8, BATTLE_MEL[8:], octave=5, vel=0.3, legato=0.6, tp=tp)
    drums(tr, 'dr', {'kick': [0, 0.75, 2, 2.75], 'snare': [1, 3, (3.75, 0.3)], 'rim': [(1.5, 0.3)],
                     'hat': [(x * 0.5, 0.25 if x % 2 else 0.4) for x in range(8)]}, 16)
    for b in (7, 15):
        roll(tr, 'dr', b, 0.45, 3.5)
    tr.drum('dr', 'cym', 0, 0.55)
    tr.drum('dr', 'cym', 32, 0.5)
    return tr


def battle3():
    """3막 별층 전투: 두 음 더 올려 금관+종 주제, 현악 트레몰로, 16분 베이스와 팀파니 — 해가 가까워진다"""
    tp = 4
    tr = Track(160, 16)
    prog = transpose(BATTLE_PROG, tp)
    tr.bus('br', 0.05, 0.5, 0.28); tr.bus('bell', 0.4, 0.22, 0.5); tr.bus('str', -0.3, 0.24, 0.35)
    tr.bus('pl', -0.45, 0.16, 0.25); tr.bus('bass', 0, 0.74, 0.05); tr.bus('dr', 0, 0.62, 0.14)
    basses(tr, 'bass', bass, prog, [(i * 0.25, 0.22, 12 if i % 4 == 2 else 0) for i in range(16)], vel=0.62)
    arp(tr, 'pl', pulse, prog, [0, 1, 2, 4], step=0.25, octave=5, vel=0.24, dur=0.16)
    block(tr, 'str', strings, prog, [(x * 0.25, 0.22) for x in range(16)], octave=4, vel=0.22, top=3)
    melody(tr, 'br', brass, 0, BATTLE_MEL, octave=4, vel=0.62, tp=tp)
    melody(tr, 'bell', bell, 0, BATTLE_MEL, octave=5, vel=0.22, legato=0.5, tp=tp)
    drums(tr, 'dr', {'kick': [0, 0.5, 1.5, 2, 2.5, 3.5], 'snare': [1, 3],
                     'tick': [(x * 0.25, 0.3 if x % 2 else 0.45) for x in range(16)]}, 16)
    drums(tr, 'dr', {'timp': [(0, 0.5), (2, 0.35)]}, 16)
    for b in (3, 7, 11, 15):
        roll(tr, 'dr', b, 0.5, 3.0 if b % 8 == 7 else 3.5)
    tr.drum('dr', 'cym', 0, 0.65)
    tr.drum('dr', 'cym', 32, 0.55)
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


# ---------- 쉬는 곳 ----------

def rest():
    """휴식 칸: 탑 안 모닥불 곁. 느린 하프와 플루트, 북 없이"""
    tr = Track(76, 8)
    prog = ['Ebmaj7', 'Cm7', 'Abmaj7', 'Bb7sus4 Bb7', 'Ebmaj7', 'Gm7', 'Abmaj7 Fm7', 'Bb7sus4']
    tr.bus('harp', -0.3, 0.45, 0.45); tr.bus('fl', 0.25, 0.46, 0.5); tr.bus('pad', 0, 0.2, 0.6); tr.bus('bass', 0, 0.55, 0.15)
    arp(tr, 'harp', harp, prog, [0, 1, 2, 3, 2, 1], step=0.5, octave=3, vel=0.45)
    block(tr, 'pad', pad, prog, [(0, 3.9)], octave=3, vel=0.42, top=3)
    basses(tr, 'bass', bass, prog, [(0, 2.8, 0), (3, 0.9, 7)], vel=0.55)
    melody(tr, 'fl', flute, 0, ['g:2 bb eb^', 'd^:3 c^', 'c^:1.5 bb:.5 ab g', 'f:3 -',
                                 'g:1.5 ab:.5 bb eb^', 'f^:2 d^ bb', 'c^:1.5 eb^:.5 ab f', 'bb:4'], octave=4, vel=0.48)
    return tr


# ---------- 사건·야시장 ----------

def event():
    """사건·야시장: 수상한 노점 골목. 도리안 하프, 글로켄, 퉁기는 베이스"""
    tr = Track(104, 8, swing=0.25)
    prog = ['Dm7', 'G7', 'Dm7', 'G7', 'Bbmaj7', 'Am7', 'Gm7', 'A7sus4 A7']
    tr.bus('harp', -0.35, 0.4, 0.3); tr.bus('gl', 0.35, 0.3, 0.45); tr.bus('bass', 0, 0.68, 0.08)
    tr.bus('ld', 0.1, 0.42, 0.35); tr.bus('dr', 0.1, 0.4, 0.15)
    arp(tr, 'harp', harp, prog, [0, 2, 1, 3], step=0.5, octave=3, vel=0.45)
    basses(tr, 'bass', pluck_bass, prog, [(0, 0.45, 0), (1, 0.45, 7), (1.5, 0.45, 10), (2.5, 0.45, 12), (3, 0.8, 7)], vel=0.72)
    melody(tr, 'gl', glock, 0, ['a:.5 - c^:.5 - d^ f^', 'e^:1.5 d^:.5 b:2', 'a:.5 - c^:.5 - d^ a^', 'g^:2 f^ e^',
                                 'd^:1.5 f^:.5 a^ g^', 'e^:2 c^ a', 'bb:1.5 d^:.5 c^ bb', 'a:2 c#^:2'], octave=5, vel=0.42)
    melody(tr, 'ld', lead, 4, ['f:2 a d^', 'c^:2 e g', 'd:2 f bb', 'a:4'], octave=4, vel=0.35)
    drums(tr, 'dr', {'shaker': [0.5, 1.5, 2.5, 3.5], 'rim': [(1, 0.35), (3, 0.3)], 'kick': [(0, 0.35)]}, 8)
    return tr


# ---------- 에피소드 ----------

def ep_daily():
    """에피소드 일상: 본부의 아침. 통통 튀는 전자 피아노와 플루트"""
    tr = Track(112, 8, swing=0.3)
    prog = ['Gmaj7', 'Em7', 'Am7', 'D7', 'Bm7', 'Em7', 'Am7 D7', 'Gmaj7']
    tr.bus('ep', -0.3, 0.48, 0.25); tr.bus('fl', 0.25, 0.48, 0.35); tr.bus('bass', 0, 0.7, 0.08); tr.bus('dr', 0.2, 0.42, 0.15)
    block(tr, 'ep', epiano, prog, [(0, 0.4), (1.5, 0.4), (2.5, 0.4), (3.5, 0.4)], octave=4, vel=0.38)
    walking(tr, 'bass', pluck_bass, prog, vel=0.72)
    melody(tr, 'fl', flute, 0, ['d^:.5 b:.5 g a b', 'e^:2 d^ b', 'c^:.5 e^:.5 a^:2 g^', 'f#^:3 -',
                                 'f#^:.5 d^:.5 b c#^ d^', 'g^:2 e^ b', 'c^ e^ d^ c^', 'b:3 -'], octave=4, vel=0.52)
    drums(tr, 'dr', {'brush': [1, 3], 'hat': [0, 0.5, 1.5, 2, 2.5, 3.5], 'kick': [(0, 0.3), (2.5, 0.25)]}, 8)
    return tr


def ep_warm():
    """에피소드 뭉클: 느린 현악과 종, 바다 위 새벽빛"""
    tr = Track(66, 8)
    prog = ['Dbmaj7', 'Bbm7', 'Gbmaj7', 'Ab7sus4 Ab7', 'Fm7', 'Bbm7', 'Gbmaj7 Ebm7', 'Ab7sus4']
    tr.bus('str', -0.2, 0.32, 0.55); tr.bus('ep', 0.3, 0.42, 0.45); tr.bus('bell', 0.35, 0.3, 0.6); tr.bus('bass', 0, 0.5, 0.2)
    block(tr, 'str', strings, prog, [(0, 3.9)], octave=3, vel=0.5)
    arp(tr, 'ep', epiano, prog, [0, 2, 3, 4, 3, 2, 1, 2], step=0.5, octave=4, vel=0.34)
    basses(tr, 'bass', bass, prog, [(0, 3.8, 0)], vel=0.55)
    melody(tr, 'bell', bell, 0, ['f^:2 eb^ db^', 'db^:3 c^', 'bb:2 db^ gb^', 'f^:4',
                                  'ab^:2 g^ f^', 'f^:2 db^:2', 'db^:1.5 eb^:.5 gb^ f^', 'eb^:4'], octave=4, vel=0.45)
    return tr


def ep_tense():
    """에피소드 긴장: 낮은 맥박, 반음씩 기어오르는 현악, 시계 틱"""
    tr = Track(92, 8)
    prog = ['Bm', 'Bm', 'G', 'F#7', 'Bm', 'C', 'Bm', 'F#7']
    tr.bus('str', -0.25, 0.34, 0.4); tr.bus('bass', 0, 0.72, 0.1); tr.bus('pl', 0.35, 0.18, 0.3); tr.bus('dr', 0, 0.5, 0.18)
    block(tr, 'str', strings, prog, [(0, 1.9), (2, 1.9)], octave=3, vel=0.48, top=3)
    basses(tr, 'bass', bass, prog, [(0, 0.4, 0), (0.75, 0.4, 0), (1.5, 0.4, 0), (2, 0.4, 0), (2.75, 0.4, 0), (3.5, 0.4, 1)], vel=0.72)
    arp(tr, 'pl', pulse, prog, [0, 1, 0, 2], step=0.5, octave=4, vel=0.26, dur=0.2)
    melody(tr, 'str', strings, 4, ['f#^:2 g^:2', 'f#^:2 e^:2', 'd^:2 c^:2', 'a#:4'], octave=4, vel=0.32)
    drums(tr, 'dr', {'tick': [x * 0.5 for x in range(8)], 'timp': [(0, 0.45)], 'kick': [(2.5, 0.3)]}, 8)
    return tr


# ---------- 튜토리얼 ----------

def tutorial():
    """첫 밤: 가볍게 걷는 하프와 금관, 겁 안 나는 전투"""
    tr = Track(118, 8)
    prog = ['C', 'Am', 'F', 'G', 'C', 'Em', 'F G', 'C']
    tr.bus('harp', -0.3, 0.42, 0.3); tr.bus('br', 0.15, 0.45, 0.3); tr.bus('bass', 0, 0.65, 0.08); tr.bus('dr', 0, 0.45, 0.15)
    arp(tr, 'harp', harp, prog, [0, 1, 2, 1], step=0.5, octave=4, vel=0.42)
    basses(tr, 'bass', pluck_bass, prog, [(0, 0.9, 0), (1, 0.4, 7), (2, 0.9, 12), (3, 0.4, 7)], vel=0.7)
    melody(tr, 'br', brass, 0, ['e^:1.5 g^:.5 c^^ g^', 'a^:2 e^:2', 'f^:1.5 a^:.5 c^^ a^', 'g^:3 -',
                                 'e^:1.5 g^:.5 c^^ e^^', 'b^:2 g^:2', 'a^ f^ d^ b', 'c^^:3 -'], octave=4, vel=0.5)
    drums(tr, 'dr', {'kick': [0, 2], 'rim': [1, 3], 'shaker': [0.5, 1.5, 2.5, 3.5]}, 8)
    return tr


# ---------- 「새벽」 2단계 ----------

def dawn2():
    """최종전 「새벽」 2단계: 같은 주제를 반음 올려 더 빠르게, 두 배 북과 몰아치는 현악"""
    tp = 1
    tr = Track(156, 16)
    prog = transpose(['F#m', 'D', 'E', 'C#7', 'F#m', 'D', 'Bm C#7', 'F#m',
                      'D', 'E', 'A', 'F#m', 'Bm', 'D', 'E', 'C#7'], tp)
    tr.bus('br', 0.05, 0.56, 0.28); tr.bus('str', -0.3, 0.3, 0.35); tr.bus('sq', 0.4, 0.2, 0.2)
    tr.bus('bass', 0, 0.78, 0.05); tr.bus('dr', 0, 0.62, 0.12); tr.bus('clk', 0.2, 0.45, 0.08)
    basses(tr, 'bass', bass, prog, [(i * 0.5, 0.42, 12 if i % 2 else 0) for i in range(8)], vel=0.78)
    arp(tr, 'str', strings, prog, [0, 1, 2, 1], step=0.25, octave=4, vel=0.32, dur=0.22)
    arp(tr, 'sq', square, prog, [0, 2, 1, 2], step=0.25, octave=5, vel=0.22, dur=0.15)
    melody(tr, 'br', brass, 0, ['c#^:1.5 f#^:.5 a^ g#^', 'f#^:2 d^:2', 'e^:1.5 g#^:.5 b^ e^', 'f^:3 c#^',
                                 'c#^:1.5 f#^:.5 a^ c#^^', 'd^^:2 a^ f#^', 'd^ f#^ f^ g#^', 'f#^:3 -',
                                 'a^:1.5 f#^:.5 d^ f#^', 'g#^:1.5 b^:.5 e^ g#^', 'a^:2 c#^^ e^^', 'f#^:3 c#^',
                                 'd^ f#^ b^ d^^', 'a^:2 f#^ d^', 'g#^ b^ e^^ b^', 'f^:2 g#^:2'], octave=4, vel=0.62, tp=tp)
    drums(tr, 'dr', {'kick': [0, 0.5, 1.5, 2, 2.5, 3.5], 'snare': [1, 3, (3.75, 0.4)], 'hat': [x * 0.5 for x in range(8)]}, 16)
    drums(tr, 'clk', {'tick': [x * 0.25 for x in range(16)]}, 16, vel=0.45)
    drums(tr, 'dr', {'timp': [(0, 0.55), (2, 0.35)]}, 16)
    for b in (3, 7, 11, 15):
        roll(tr, 'dr', b, 0.55, 3.0)
    tr.drum('dr', 'cym', 0, 0.65)
    tr.drum('dr', 'cym', 32, 0.55)
    return tr


# ---------- 보스 변형 ----------

def boss_queen():
    """1막 보스 변형 「안개 마녀 여왕」: 안개 낀 왈츠 느낌(3박 걸음), 하프와 플루트, 낮게 깔린 오르간"""
    tr = Track(132, 16)
    prog = ['Bm', 'Bm', 'G', 'G', 'Em', 'F#7', 'Bm', 'F#7',
            'G', 'A', 'F#m', 'Bm', 'Em', 'G', 'C#m7b5', 'F#7']
    tr.bus('harp', 0.35, 0.34, 0.5); tr.bus('fl', -0.15, 0.4, 0.45); tr.bus('org', 0, 0.24, 0.45)
    tr.bus('bass', 0, 0.72, 0.08); tr.bus('dr', 0, 0.5, 0.2)
    arp(tr, 'harp', harp, prog, [0, 2, 4, 2, 1, 2], step=0.5, octave=4, vel=0.32, dur=0.6)
    block(tr, 'org', pad, prog, [(0, 3.9)], octave=3, vel=0.5)
    basses(tr, 'bass', bass, prog, [(0, 1.4, 0), (1.5, 0.4, 7), (3, 0.9, 12)], vel=0.75)
    melody(tr, 'fl', flute, 0, ['f#^:3 d^', 'c#^:2 b:2', 'b^:3 g^', 'f#^:2 d^:2',
                                 'e^:1.5 g^:.5 b^ a^', 'a#^:3 f#^', 'b^:2 d^^:2', 'c#^^:4',
                                 'd^^:3 b^', 'c#^^:2 a^:2', 'a^:3 f#^', 'f#^:2 d^:2',
                                 'g^ b^ e^^ d^^', 'b^:2 g^:2', 'g^:2 e^:2', 'a#^:4'], octave=4, vel=0.55)
    drums(tr, 'dr', {'kick': [0, (2.5, 0.4)], 'brush': [1, 2, 3], 'timp': [(0, 0.35)]}, 16)
    for b in (7, 15):
        roll(tr, 'dr', b, 0.4, 3.0)
    return tr


def boss_whale():
    """2막 보스 변형 「폭풍 고래」: 느리고 거대한 금관 울음 위로 몰아치는 폭풍 현악·북"""
    tr = Track(144, 16)
    prog = ['Dm', 'Bb', 'C', 'Am', 'Dm', 'Bb', 'Gm A7', 'Dm',
            'Bb', 'C', 'F', 'Dm', 'Gm', 'Bb', 'Gm A7', 'A7']
    tr.bus('br', 0.05, 0.55, 0.32); tr.bus('str', -0.3, 0.3, 0.35); tr.bus('bell', 0.4, 0.22, 0.5)
    tr.bus('bass', 0, 0.78, 0.06); tr.bus('dr', 0, 0.62, 0.15)
    basses(tr, 'bass', bass, prog, EIGHTS, vel=0.76)
    arp(tr, 'str', strings, prog, [0, 1, 2, 1, 2, 3, 2, 1], step=0.25, octave=4, vel=0.3, dur=0.22)
    arp(tr, 'bell', bell, prog, [0, 4], step=2, octave=5, vel=0.28)
    melody(tr, 'br', brass, 0, ['d^:3 a', 'f^:2 d^:2', 'e^:3 c^', 'a^:4',
                                 'd^^:2 a^ f^', 'f^:2 d^ bb', 'bb^ a^ g^ c#^', 'd^:4',
                                 'f^:2 bb^:2', 'g^:2 e^ c^', 'a^:2 c^^ a^', 'f^:3 d^',
                                 'g^ bb^ d^^ bb^', 'f^:2 d^:2', 'e^ g^ c#^^ e^', 'e^:4'], octave=4, vel=0.62)
    drums(tr, 'dr', {'kick': [0, 1.5, 2, 3.5], 'snare': [1, 3], 'timp': [(0, 0.55), (2, 0.35)], 'hat': [x * 0.5 for x in range(8)]}, 16)
    for b in (3, 7, 11, 15):
        roll(tr, 'dr', b, 0.55, 3.0)
    tr.drum('dr', 'cym', 0, 0.65)
    tr.drum('dr', 'cym', 32, 0.55)
    return tr


def dawn3():
    """「새벽」 3단계 「한낮」(밤의 깊이 5+): 주제를 한 음 더 올려 가장 빠르게, 종소리와 몰아치는 사각파"""
    tp = 3
    tr = Track(168, 16)
    prog = transpose(['F#m', 'D', 'E', 'C#7', 'F#m', 'D', 'Bm C#7', 'F#m',
                      'D', 'E', 'A', 'F#m', 'Bm', 'D', 'E', 'C#7'], tp)
    tr.bus('br', 0.05, 0.56, 0.26); tr.bus('sq', 0.4, 0.22, 0.18); tr.bus('bell', -0.35, 0.3, 0.45)
    tr.bus('bass', 0, 0.8, 0.05); tr.bus('dr', 0, 0.64, 0.1); tr.bus('clk', 0.2, 0.42, 0.06)
    basses(tr, 'bass', bass, prog, [(i * 0.5, 0.42, 12 if i % 2 else 0) for i in range(8)], vel=0.8)
    arp(tr, 'sq', square, prog, [0, 2, 1, 2, 0, 3, 1, 2], step=0.25, octave=5, vel=0.24, dur=0.14)
    arp(tr, 'bell', bell, prog, [0, 2, 4], step=1, octave=5, vel=0.3)
    melody(tr, 'br', brass, 0, ['c#^:1.5 f#^:.5 a^ g#^', 'f#^:2 d^:2', 'e^:1.5 g#^:.5 b^ e^', 'f^:3 c#^',
                                 'c#^:1.5 f#^:.5 a^ c#^^', 'd^^:2 a^ f#^', 'd^ f#^ f^ g#^', 'f#^:3 -',
                                 'a^:1.5 f#^:.5 d^ f#^', 'g#^:1.5 b^:.5 e^ g#^', 'a^:2 c#^^ e^^', 'f#^:3 c#^',
                                 'd^ f#^ b^ d^^', 'a^:2 f#^ d^', 'g#^ b^ e^^ b^', 'f^:2 g#^:2'], octave=4, vel=0.64, tp=tp)
    drums(tr, 'dr', {'kick': [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5], 'snare': [1, 3, (2.75, 0.4), (3.75, 0.45)], 'ohat': [0.5, 1.5, 2.5, 3.5]}, 16)
    drums(tr, 'clk', {'tick': [x * 0.25 for x in range(16)]}, 16, vel=0.5)
    for b in (3, 7, 11, 15):
        roll(tr, 'dr', b, 0.6, 2.5)
    for b in (0, 16, 32, 48):
        tr.drum('dr', 'cym', b, 0.6)
    return tr


# ---------- 시즌 1 「유성우의 밤」 ----------

def organ(n, dur, vel):
    """파이프 오르간풍 FM: 지속음 위에 옥타브·12도 배음을 겹친다"""
    k = dict(ratio=1, index=0.8, idecay=20, a=0.03, d=1.0, s=0.95, r=0.18)
    y = fm(n, dur, vel, **k)
    y += fm(n + 12, dur, vel * 0.5, **k)
    y += fm(n + 19, dur, vel * 0.25, **k)
    return lowpass(y, 3600)


def bars68(prog):
    """6/8 화음 진행: 마디마다 화음 하나(6) 또는 둘(3+3). [(이름, 시작 8분, 길이)]"""
    out = []
    for item in prog:
        names = item.split()
        out.append([(c, i * 6 / len(names), 6 / len(names)) for i, c in enumerate(names)])
    return out


def season():
    """시즌 1 「유성우의 밤」 시즌 화면: 맑고 넓은 밤하늘. 느린 6/8(8분=144, 점4분=48), 종·글로켄 반짝임, 24마디=1분"""
    tr = Track(144, 24, beats_per_bar=6)
    prog = ['Emaj9', 'C#m9', 'Amaj9', 'B7sus4', 'Emaj9', 'G#m7', 'Amaj7', 'B7sus4 B7',
            'Amaj7', 'B6', 'C#m7', 'G#m7', 'Amaj9', 'F#m9', 'B7sus4', 'B7',
            'Cmaj7', 'D', 'Emaj9', 'C#m9', 'Amaj7', 'F#m9', 'B7sus4', 'B7sus4 B7']
    tr.bus('bell', 0.25, 0.42, 0.6); tr.bus('fl', -0.2, 0.34, 0.55); tr.bus('harp', -0.4, 0.34, 0.5)
    tr.bus('pad', 0, 0.2, 0.7); tr.bus('gl', 0.45, 0.22, 0.7); tr.bus('bass', 0, 0.5, 0.2); tr.bus('dr', 0.15, 0.3, 0.5)
    for b, bar in enumerate(bars68(prog)):
        for name, at, beats in bar:
            s = b * 6 + at
            notes = chord(name, 4)
            tr.note('bass', bass, s, beats * 0.95, root(name, 2), 0.55)
            for n in chord(name, 3)[:3]:
                tr.note('pad', pad, s, beats - 0.1, n, 0.45)
            # 하프: 8분마다 위로 올랐다 내려오는 물결
            for k in range(int(beats)):
                idx = [0, 1, 2, 4, 2, 1][(int(at) + k) % 6]
                n = notes[idx % len(notes)] + 12 * (idx // len(notes)) - 12
                tr.note('harp', harp, s + k, 1.4, n, 0.42 if k == 0 else 0.32)
        # 반짝임: 글로켄이 마디마다 높은 화음음을 두세 번 흩뿌린다 (마디마다 자리를 조금씩 바꿈)
        top = chord(bar[-1][0], 6)
        for j, (at, i) in enumerate([(1.5, 2), (4, 0), (5.5, 1)] if b % 2 else [(2, 1), (3.5, 2), (5, 0)]):
            tr.note('gl', glock, b * 6 + at, 0.5, top[(i + b) % len(top)], 0.28 - 0.04 * j)
    mel_a = ['b:3 g#:2 e:1', 'g#:4 c#^:2', 'c#^:3 b:2 a:1', 'f#:6',
             'b:3 g#:2 b:1', 'd#^:4 e^:2', 'c#^:3 e^:2 c#^:1', 'b:6']
    mel_b = ['a:2 c#^:2 e^:2', 'g#^:4 f#^:2', 'e^:3 g#:2 c#^:1', 'd#^:6',
             'c#^:2 e^:2 a^:2', 'g#^:3 f#^:2 e^:1', 'e^:3 f#^:2 a^:1', 'f#^:4 d#^:2']
    mel_c = ['e^:3 g^:2 b^:1', 'a^:4 f#^:2', 'g#^:6', 'e^:3 d#^:2 c#^:1',
             'c#^:2 e^:2 g#^:2', 'a^:3 g#^:2 f#^:1', 'e^:4 f#^:2', 'd#^:3 f#^:2 b:1']
    melody(tr, 'bell', bell, 0, mel_a + mel_b + mel_c, octave=5, vel=0.5)
    melody(tr, 'fl', flute, 8, mel_b + mel_c, octave=4, vel=0.42)
    # 북은 거의 없이: 둘째 단락부터 셰이커 숨결, 셋째 단락 머리에 심벌 부풂
    for b in range(8, 24):
        tr.drum('dr', 'shaker', b * 6 + 3, 0.35)
        tr.drum('dr', 'shaker', b * 6 + 5, 0.22)
    for b in (0, 8, 16):
        tr.drum('dr', 'timp', b * 6, 0.25)
    tr.drum('dr', 'cym', 16 * 6, 0.3)
    return tr


STAR_PROG = ['Fm', 'Db', 'Bbm', 'C7', 'Fm', 'Dbmaj7', 'Gb', 'C7',
             'Db', 'Eb', 'Cm7', 'Fm', 'Bbm', 'Gb', 'Db', 'C7sus4 C7']
STAR_MEL = ['c^^:1.5 ab^:.5 f^ c^', 'db^^:1.5 ab^:.5 f^ db^', 'bb^:1.5 f^:.5 db^ bb', 'c^:2 e^ g^',
            'c^^:1.5 ab^:.5 f^ c^', 'c^^:1.5 ab^:.5 f^ db^', 'bb^:1.5 gb^:.5 db^ bb', 'g^:2 e^:2',
            'f^:2 ab^ db^^', 'eb^^:1.5 bb^:.5 g^ eb^', 'g^:2 bb^ eb^^', 'f^^:1.5 c^^:.5 ab^ f^',
            'f^^:1.5 db^^:.5 bb^ f^', 'gb^^:1.5 db^^:.5 bb^ gb^', 'f^^:1.5 db^^:.5 ab^ f^', 'f^:2 e^:2']


def fall(tr, bus, inst, prog, octave=5, step=0.25, vel=0.4, dur=0.35, start_bar=0):
    """떨어지는 별: 박마다 위에서 아래로 내리긋는 화음 아르페지오, 박이 지날수록 시작음이 한 칸씩 내려간다"""
    per = int(round(1 / step))
    for b, bar in enumerate(chords_per_bar(prog)):
        for name, at, beats in bar:
            tones = sorted({n + 12 * o for n in chord(name, octave - 1)[:4] for o in (0, 1)}, reverse=True)
            for k in range(int(beats)):
                for i in range(per):
                    n = tones[(k + i) % len(tones)]
                    tr.note(bus, inst, (start_bar + b) * 4 + at + k + i * step, dur, n, vel * (1.0 if i == 0 else 0.75))


def boss_star():
    """시즌 보스 「떨어진 별의 왕」 1·2단계: 장엄한 오르간과 금관, 종소리로 쏟아지는 하행 아르페지오가 주제. 150"""
    tr = Track(150, 16)
    prog = STAR_PROG
    tr.bus('org', 0, 0.3, 0.45); tr.bus('br', 0.05, 0.52, 0.32); tr.bus('fall', 0.4, 0.26, 0.5)
    tr.bus('str', -0.35, 0.24, 0.4); tr.bus('bass', 0, 0.74, 0.06); tr.bus('dr', 0, 0.6, 0.18)
    block(tr, 'org', organ, prog, [(0, 3.9)], octave=3, vel=0.45)
    fall(tr, 'fall', bell, prog, octave=6, vel=0.32)
    block(tr, 'str', strings, prog, [(0, 1.4), (1.5, 0.4), (2, 1.9)], octave=4, vel=0.32, top=3)
    basses(tr, 'bass', bass, prog, [(0, 1.4, 0), (1.5, 0.4, 0), (2, 0.45, 12), (2.5, 0.45, 0), (3, 0.9, 7)], vel=0.78)
    melody(tr, 'br', brass, 0, STAR_MEL, octave=3, vel=0.62)
    melody(tr, 'br', brass, 8, STAR_MEL[8:], octave=2, vel=0.4)
    drums(tr, 'dr', {'kick': [0, 2, 2.5], 'snare': [1, 3], 'hat': [(x * 0.5, 0.3 if x % 2 else 0.42) for x in range(8)],
                     'timp': [(0, 0.55), (2, 0.3)]}, 16)
    for b in (7, 15):
        roll(tr, 'dr', b, 0.5, 3.0)
    for b in (0, 32):
        tr.drum('dr', 'cym', b, 0.6)
    return tr


def boss_star3():
    """「떨어진 별의 왕」 3단계(체력 25% 아래, 두 번 행동): 같은 주제를 한 음 올려 빠르고 높게, 별비는 16분 두 겹, 북은 두 배. 172"""
    tp = 2
    tr = Track(172, 16)
    prog = transpose(STAR_PROG, tp)
    tr.bus('org', 0, 0.26, 0.4); tr.bus('br', 0.05, 0.54, 0.28); tr.bus('ld', -0.1, 0.3, 0.3)
    tr.bus('fall', 0.4, 0.26, 0.45); tr.bus('gl', -0.4, 0.18, 0.45); tr.bus('bass', 0, 0.78, 0.05)
    tr.bus('dr', 0, 0.64, 0.12)
    block(tr, 'org', organ, prog, [(0, 1.9), (2, 1.9)], octave=3, vel=0.42)
    fall(tr, 'fall', bell, prog, octave=6, vel=0.3, dur=0.25)
    fall(tr, 'gl', glock, prog, octave=6, step=0.125, vel=0.22, dur=0.12)
    basses(tr, 'bass', bass, prog, [(i * 0.25, 0.22, 12 if i % 4 == 2 else 0) for i in range(16)], vel=0.66)
    melody(tr, 'br', brass, 0, STAR_MEL, octave=3, vel=0.64, tp=tp)
    melody(tr, 'ld', lead, 0, STAR_MEL, octave=4, vel=0.34, legato=0.7, tp=tp)
    drums(tr, 'dr', {'kick': [x * 0.5 for x in range(8)], 'snare': [1, 3, (1.75, 0.3), (3.5, 0.4), (3.75, 0.45)],
                     'hat': [(x * 0.25, 0.25 if x % 2 else 0.4) for x in range(16)], 'timp': [(0, 0.6), (1, 0.3), (2, 0.45), (3, 0.3)]}, 16)
    for b in (3, 7, 11, 15):
        roll(tr, 'dr', b, 0.6, 2.5 if b % 8 == 7 else 3.0)
    for b in (0, 16, 32, 48):
        tr.drum('dr', 'cym', b, 0.62)
    return tr


# ---------- 본편 2장 「운하 도시」·3장 「별의 끝」 보스 ----------

def wheel_bass(tr, bus, prog, octave=2, vel=0.7):
    """태엽 베이스: 8분 스타카토로 근음·옥타브·5도를 톱니처럼 오간다"""
    steps = [0, 12, 7, 12, 0, 12, 10, 12]
    basses(tr, bus, pluck_bass, prog, [(i * 0.5, 0.18, steps[i]) for i in range(8)], octave=octave, vel=vel)


CANAL_A = ['Dm', 'Bb', 'C', 'A7', 'Dm', 'Gm', 'Bb A7', 'Dm']
CANAL_B = ['Bb', 'C', 'Am', 'Dm', 'Gm', 'C', 'F', 'A7sus4 A7']
CANAL_C = ['Eb', 'Eb', 'A7sus4', 'A7']
CANAL_MA = ['d^:1.5 a:.5 f^ e^', 'd^:1.5 f^:.5 bb^ a^', 'g^:1.5 e^:.5 c^ e^', 'a^:3 c#^',
            'd^:1.5 f^:.5 a^ d^^', 'bb^:2 a^ g^', 'f^ d^ e^ c#^', 'd^:3 -']
CANAL_MB = ['f^:2 d^ f^', 'g^:2 e^ g^', 'a^:1.5 c^^:.5 a^ e^', 'f^:3 a^',
            'bb^:1.5 a^:.5 g^ d^', 'e^:1.5 g^:.5 c^^ bb^', 'a^:2 f^ c^', 'e^:2 c#^:2']
CANAL_MC = ['g^:2 bb^ eb^^', 'd^^:2 bb^:2', 'a^:2 g^ e^', 'c#^:4']


def boss_canal():
    """2장 1·2막 보스(수문장·멈춘 태엽 기사): 물 흐르는 하프 아르페지오 위로 태엽 같은 스타카토 베이스와 톱니 틱. 148, 36마디"""
    tr = Track(148, 36)
    prog = CANAL_A + CANAL_A + CANAL_B + CANAL_A + CANAL_C
    tr.bus('harp', -0.35, 0.36, 0.45); tr.bus('ep', 0.4, 0.2, 0.5); tr.bus('ld', 0.05, 0.36, 0.3)
    tr.bus('br', -0.05, 0.42, 0.3); tr.bus('str', 0.25, 0.26, 0.4); tr.bus('bass', 0, 0.74, 0.04)
    tr.bus('dr', 0, 0.58, 0.12); tr.bus('clk', 0.3, 0.5, 0.08)
    # 물결: 16분으로 올랐다 내려오는 하프, 둘째 단락부터 8분 전자 피아노 메아리
    arp(tr, 'harp', harp, prog, [0, 1, 2, 4, 5, 4, 2, 1], step=0.25, octave=4, vel=0.34, dur=0.4)
    arp(tr, 'ep', epiano, prog[8:32], [5, 4, 2, 1], step=0.5, octave=5, vel=0.2, start_bar=8, dur=0.4)
    wheel_bass(tr, 'bass', prog, vel=0.72)
    block(tr, 'str', strings, prog, [(0, 3.9)], octave=3, vel=0.36, top=3)
    mel = CANAL_MA + CANAL_MA + CANAL_MB + CANAL_MA + CANAL_MC
    melody(tr, 'ld', lead, 0, mel, octave=4, vel=0.4, legato=0.85)
    melody(tr, 'br', brass, 8, mel[8:], octave=3, vel=0.42)
    # 태엽: 16분 틱이 엇박에 걸리고 림이 톱니처럼 끼어든다
    drums(tr, 'clk', {'tick': [(x * 0.25, 0.55 if x % 4 == 2 else 0.3) for x in range(16)], 'rim': [(1.75, 0.4), (3.75, 0.4)]}, 36)
    drums(tr, 'dr', {'kick': [0, 2.5], 'timp': [(0, 0.35)]}, 8)
    drums(tr, 'dr', {'kick': [0, 1.5, 2.5], 'snare': [1, 3], 'hat': [(x * 0.5, 0.3) for x in range(8)]}, 24, start_bar=8)
    drums(tr, 'dr', {'timp': [(0, 0.55), (2, 0.4)], 'snare': [(1, 0.4), (3, 0.5)]}, 4, start_bar=32)
    for b in (15, 23, 31):
        roll(tr, 'dr', b, 0.45)
    roll(tr, 'dr', 35, 0.55, 2.0)
    for b in (8, 16, 24):
        tr.drum('dr', 'cym', b * 4, 0.5)
    return tr


def great_bell(n, dur, vel):
    """무거운 교회 종: 비조화 배음(1.41·2.76) 두 겹, 길게 울린다"""
    y = fm(n, dur, vel, ratio=1.41, index=3.0, idecay=1.2, a=0.002, d=3.0, s=0.0, r=1.2)
    z = fm(n + 12, dur, vel * 0.35, ratio=2.76, index=1.5, idecay=0.3, a=0.001, d=1.2, s=0.0, r=0.6)
    y[:len(z)] += z[:len(y)]
    return lowpass(y, 5200)


BELL_SLOW = ['Cm', 'Cm', 'Ab', 'Ab', 'Fm', 'Fm', 'G', 'G', 'Cm', 'Ab', 'Fm', 'G7']
BELL_SLOW_MEL = ['c^:2 g:2', 'eb^:2 c^:2', 'ab:2 eb^:2', 'c^:4', 'f^:2 c^:2', 'ab:2 f:2', 'g:2 b:2', 'd^:4',
                 'c^:2 g:2', 'eb^:2 ab^:2', 'f^:2 c^:2', 'b:2 d^:2']
BELL_A = ['Cm', 'Ab', 'Fm', 'G', 'Cm', 'Ab', 'Db', 'G7']
BELL_B = ['Ab', 'Bb', 'Gm', 'Cm', 'Fm', 'Db', 'Ab G', 'G7']
BELL_MA = ['c^^:1.5 g^:.5 eb^^ c^^', 'eb^^:1.5 c^^:.5 ab^ eb^', 'f^:1.5 ab^:.5 c^^ f^^', 'd^^:3 b^',
           'c^^:1.5 g^:.5 eb^^ g^^', 'ab^^:2 eb^^ c^^', 'db^^:1.5 f^^:.5 db^^ ab^', 'b^:2 d^^:2']
BELL_MB = ['c^^:2 eb^^ ab^^', 'f^^:1.5 d^^:.5 bb^ d^^', 'g^^:2 d^^ bb^', 'c^^:3 g^',
           'ab^:1.5 c^^:.5 f^^ ab^^', 'f^^:2 db^^ ab^', 'c^^ eb^^ d^^ b^', 'd^^:2 g^^:2']


def bell_fast(tr, prog, mel, start, tp=0, hi=False):
    """「침묵의 종지기」 빠른 부분: 오르간 두 박 화음, 종이 8분으로 내려 울리고(체인지 링잉), 금관이 주제, 마디 머리에 큰 종"""
    s = start
    block(tr, 'org', organ, prog, [(0, 1.9), (2, 1.9)], octave=3, vel=0.4, start_bar=s)
    arp(tr, 'bell', bell, prog, [4, 2, 1, 0], step=0.5, octave=5, vel=0.24, start_bar=s, dur=0.5)
    basses(tr, 'bass', bass, prog, EIGHTS, vel=0.7, start_bar=s)
    melody(tr, 'br', brass, s, mel, octave=3, vel=0.6, tp=tp)
    if hi:
        melody(tr, 'ld', lead, s, mel, octave=4, vel=0.3, legato=0.7, tp=tp)
    for b, bar in enumerate(chords_per_bar(prog)):
        tr.note('gb', great_bell, (s + b) * 4, 3.5, root(bar[0][0], 3), 0.4)
    n = len(prog)
    drums(tr, 'dr', {'kick': [0, 1.5, 2, 3.5] if hi else [0, 2, 2.5], 'snare': [1, 3],
                     'hat': [(x * 0.5, 0.3 if x % 2 else 0.42) for x in range(8)], 'timp': [(0, 0.5), (2, 0.3)]}, n, start_bar=s)
    for b in range(s + 3, s + n, 4):
        roll(tr, 'dr', b, 0.5, 2.5 if hi and (b - s) % 8 == 7 else 3.0)
    tr.drum('dr', 'cym', s * 4, 0.6)


def boss_bell():
    """2장 마지막 보스 「침묵의 종지기」: 느린 큰 종과 오르간으로 시작해(12마디, 두 박 걸음) 북이 들어오며 빨라진다(24마디). 152, 36마디"""
    tr = Track(152, 36)
    tr.bus('gb', 0, 0.5, 0.6); tr.bus('org', 0, 0.3, 0.45); tr.bus('bell', 0.4, 0.26, 0.5); tr.bus('br', 0.05, 0.52, 0.3)
    tr.bus('ld', -0.15, 0.3, 0.3); tr.bus('bass', 0, 0.74, 0.06); tr.bus('dr', 0, 0.6, 0.16)
    # 느린 부분: 큰 종이 두 박마다 무겁게 주제를 울리고, 오르간 긴 화음, 낮은 종이 3박째에 대답
    block(tr, 'org', organ, BELL_SLOW, [(0, 3.9)], octave=3, vel=0.45)
    melody(tr, 'gb', great_bell, 0, BELL_SLOW_MEL, octave=4, vel=0.5, legato=1.0)
    basses(tr, 'bass', bass, BELL_SLOW, [(0, 3.8, 0)], vel=0.6)
    for b, bar in enumerate(chords_per_bar(BELL_SLOW)):
        tr.note('gb', great_bell, b * 4 + 2, 1.8, root(bar[0][0], 2), 0.3)
    drums(tr, 'dr', {'timp': [(0, 0.45)]}, 8)
    drums(tr, 'dr', {'timp': [(0, 0.5), (2, 0.35)], 'kick': [(0, 0.5)]}, 3, start_bar=8)
    t = 11 * 4
    for i in range(16):                                   # 빨라지기 직전 스네어가 점점 세게 몰아친다
        tr.drum('dr', 'snare', t + i * 0.25, 0.15 + 0.03 * i)
    tr.drum('dr', 'timp', t + 3.5, 0.6)
    bell_fast(tr, BELL_A + BELL_A + BELL_B, BELL_MA + BELL_MA + BELL_MB, 12)
    return tr


def boss_bell2():
    """「침묵의 종지기」 3단계(종이 흔들린다): 같은 주제를 한 음 올려 처음부터 빠르고 높게, 리드가 옥타브 위로 겹치고 글로켄이 떤다. 172, 32마디"""
    tp = 2
    tr = Track(172, 32)
    tr.bus('gb', 0, 0.44, 0.55); tr.bus('org', 0, 0.26, 0.4); tr.bus('bell', 0.4, 0.26, 0.45); tr.bus('br', 0.05, 0.54, 0.28)
    tr.bus('ld', -0.15, 0.32, 0.3); tr.bus('gl', -0.4, 0.16, 0.45); tr.bus('bass', 0, 0.78, 0.05); tr.bus('dr', 0, 0.64, 0.12)
    prog = transpose(BELL_A + BELL_B + BELL_A + BELL_B, tp)
    bell_fast(tr, prog, BELL_MA + BELL_MB + BELL_MA + BELL_MB, 0, tp=tp, hi=True)
    arp(tr, 'gl', glock, prog, [0, 1, 2, 4, 2, 1, 2, 4], step=0.25, octave=6, vel=0.14, dur=0.15)
    tr.drum('dr', 'cym', 64, 0.62)
    return tr


def ice_bell(n, dur, vel):
    """맑고 차가운 유리 종: 높은 배음(7배) FM에 한 옥타브 위 순음을 살짝"""
    y = fm(n, dur, vel, ratio=7.0, index=1.3, idecay=0.12, a=0.001, d=1.3, s=0.0, r=0.9)
    z = fm(n + 12, dur, vel * 0.25, ratio=1, index=0.1, idecay=0.5, a=0.002, d=0.8, s=0.0, r=0.6)
    y[:len(z)] += z[:len(y)]
    return y


ICE_A = ['Em9', 'Cmaj7', 'Am9', 'B7sus4', 'Em9', 'Cmaj7', 'D', 'B7sus4 B7']
ICE_B = ['Cmaj7', 'D', 'Bm7', 'Em9', 'Am9', 'D', 'Gmaj7', 'B7sus4 B7']
ICE_MA = ['b^:2 e^ f#^', 'g^:1.5 e^:.5 b:2', 'c^^:1.5 b^:.5 a^ e^', 'f#^:3 e^',
          'b^:2 e^^ d^^', 'b^:1.5 g^:.5 e^ g^', 'a^:2 f#^ d^', 'e^:2 d#^:2']
ICE_MB = ['g^:2 b^ e^^', 'f#^:1.5 a^:.5 d^^ a^', 'b^:2 d^^ f#^', 'g^:3 f#^',
          'e^^:1.5 c^^:.5 a^ b^', 'a^:2 f#^ a^', 'b^:1.5 f#^:.5 d^ f#^', 'e^:2 d#^:2']


def boss_ice():
    """3장 1·2막 보스(얼어붙은 등대지기·오로라 파수꾼): 맑은 유리 종 16분 아르페지오, 좌우로 넓게 벌린 패드, 플루트 주제. 140, 32마디"""
    tr = Track(140, 32)
    prog = ICE_A + ICE_A + ICE_B + ICE_A
    tr.bus('ice', 0.35, 0.3, 0.6); tr.bus('padL', -0.7, 0.2, 0.75); tr.bus('padR', 0.7, 0.2, 0.75)
    tr.bus('fl', -0.1, 0.4, 0.5); tr.bus('ib', 0.15, 0.34, 0.6); tr.bus('gl', -0.45, 0.18, 0.65)
    tr.bus('bass', 0, 0.68, 0.1); tr.bus('dr', 0, 0.52, 0.2)
    arp(tr, 'ice', ice_bell, prog, [0, 2, 4, 1, 3, 4, 2, 1], step=0.25, octave=5, vel=0.24, dur=0.3)
    block(tr, 'padL', pad, prog, [(0, 3.95)], octave=3, vel=0.5)
    block(tr, 'padR', pad, prog, [(0, 3.95)], octave=4, vel=0.42)
    basses(tr, 'bass', bass, prog, [(0, 1.4, 0), (1.5, 0.9, 0), (2.5, 0.4, 7), (3, 0.9, 12)], vel=0.66)
    mel = ICE_MA + ICE_MA + ICE_MB + ICE_MA
    melody(tr, 'fl', flute, 0, mel, octave=4, vel=0.48)
    melody(tr, 'ib', ice_bell, 8, mel[8:], octave=5, vel=0.34, legato=1.0)
    for b in range(32):                                    # 얼음 조각: 글로켄이 엇박에 하나씩
        top = chord(prog[b].split()[-1], 6)
        tr.note('gl', glock, b * 4 + (1.5 if b % 2 else 3.5), 0.5, top[b % len(top)], 0.22)
    drums(tr, 'dr', {'shaker': [(x * 0.25, 0.3 if x % 2 else 0.18) for x in range(16)]}, 32)
    drums(tr, 'dr', {'kick': [0, 2.5], 'snare': [2], 'timp': [(0, 0.35)]}, 8)
    drums(tr, 'dr', {'kick': [0, 1.5, 2.5], 'snare': [1, 3], 'ohat': [(1.5, 0.25), (3.5, 0.25)]}, 24, start_bar=8)
    for b in (15, 23, 31):
        roll(tr, 'dr', b, 0.4)
    for b in (8, 16, 24):
        tr.drum('dr', 'cym', b * 4, 0.45)
    return tr


NIGHT_A = ['Eb', 'Bb', 'Cm7', 'Ab', 'Eb', 'Gm7', 'Abmaj7', 'Bb7sus4 Bb']
NIGHT_B = ['Ab', 'Bb', 'Gm7', 'Cm7', 'Fm7', 'Bb', 'Ebmaj7', 'Ab Bb']
NIGHT_C = ['Ab', 'Bb', 'Cm', 'Ab', 'Fm7', 'Gm7', 'Ab', 'Bb7sus4 Bb']
NIGHT_MA = ['g^:1.5 bb^:.5 eb^^ bb^', 'd^^:2 bb^ f^', 'g^:1.5 eb^:.5 c^ g^', 'ab^:3 c^^',
            'bb^:1.5 g^:.5 eb^^ g^^', 'f^^:2 d^^ bb^', 'c^^:1.5 eb^^:.5 g^ c^^', 'bb^:2 f^ d^']
NIGHT_MB = ['c^^:2 ab^ eb^', 'd^^:1.5 f^^:.5 d^^ bb^', 'bb^:2 d^^ g^^', 'g^^:3 eb^^',
            'f^^:1.5 eb^^:.5 c^^ ab^', 'bb^:2 d^^ f^^', 'g^^:1.5 f^^:.5 eb^^ d^^', 'c^^:2 d^^:2']
NIGHT_MC = ['eb^^:2 c^^ ab^', 'f^^:2 d^^ bb^', 'g^^:1.5 eb^^:.5 c^^ g^^', 'ab^^:2 eb^^:2',
            'f^^:1.5 ab^^:.5 c^^^ ab^^', 'g^^:1.5 bb^^:.5 d^^^ bb^^', 'c^^^:2 ab^^ eb^^', 'f^^:2 d^^:2']
NIGHT_PROG = NIGHT_A + NIGHT_B + NIGHT_A + NIGHT_C
NIGHT_MEL = NIGHT_MA + NIGHT_MB + NIGHT_MA + NIGHT_MC
NIGHT_STR = ['eb^:2 g^:2', 'f^:2 d^:2', 'eb^:2 g^:2', 'c^:4', 'g^:2 bb^:2', 'bb^:2 d^^:2', 'c^^:2 eb^^:2', 'd^^:4',
             'c^^:4', 'd^^:4', 'eb^^:2 c^^:2', 'c^^:4', 'ab^:2 c^^:2', 'bb^:2 d^^:2', 'eb^^:2 c^^:2', 'bb^:2 d^^:2']


def boss_firstnight():
    """3장 마지막 보스 「첫 밤」: 장엄한 장조 오르간·금관, 별이 쏟아지듯 내리긋는 종 아르페지오, 셋째 단락부터 글로켄 별비와 현악 대선율. 132, 32마디"""
    tr = Track(132, 32)
    prog = NIGHT_PROG
    tr.bus('org', 0, 0.3, 0.5); tr.bus('br', 0.05, 0.52, 0.34); tr.bus('fall', 0.4, 0.26, 0.55)
    tr.bus('gl', -0.45, 0.18, 0.6); tr.bus('str', -0.3, 0.3, 0.45); tr.bus('bass', 0, 0.72, 0.08); tr.bus('dr', 0, 0.56, 0.2)
    block(tr, 'org', organ, prog, [(0, 3.9)], octave=3, vel=0.42)
    fall(tr, 'fall', bell, prog, octave=6, vel=0.28, dur=0.4)
    fall(tr, 'gl', glock, prog[16:], octave=6, step=0.125, vel=0.16, dur=0.14, start_bar=16)
    basses(tr, 'bass', bass, prog, [(0, 1.4, 0), (1.5, 0.4, 0), (2, 0.9, 7), (3, 0.9, 12)], vel=0.74)
    melody(tr, 'br', brass, 0, NIGHT_MEL, octave=3, vel=0.6)
    melody(tr, 'str', strings, 16, NIGHT_STR, octave=3, vel=0.34)
    drums(tr, 'dr', {'kick': [0, 2.5], 'snare': [(2, 0.55)], 'timp': [(0, 0.5)], 'hat': [(1, 0.3), (3, 0.3)]}, 16)
    drums(tr, 'dr', {'kick': [0, 1.5, 2.5], 'snare': [1, 3], 'hat': [(x * 0.5, 0.3) for x in range(8)], 'timp': [(0, 0.5), (2, 0.3)]}, 16, start_bar=16)
    for b in (7, 15, 23):
        roll(tr, 'dr', b, 0.45)
    roll(tr, 'dr', 31, 0.55, 2.0)
    for b in (0, 16, 24):
        tr.drum('dr', 'cym', b * 4, 0.55)
    return tr


def boss_firstnight2():
    """「첫 밤」 3단계(새벽빛이 스며든다): 같은 주제를 한 음 올리고 단조 화음을 장조로 바꿔 밝게, 플루트가 옥타브 위, 현악 트레몰로, 별비 두 겹. 148, 32마디"""
    tp = 2
    tr = Track(148, 32)
    sub = {'Cm7': 'Ab', 'Gm7': 'Ebmaj7', 'Cm': 'Ab', 'Fm7': 'Ab'}            # 단조 화음 → 장조 (멜로디 음은 그대로 맞는다)
    prog = transpose([' '.join(sub.get(c, c) for c in bar.split()) for bar in NIGHT_PROG], tp)
    tr.bus('org', 0, 0.26, 0.45); tr.bus('br', 0.05, 0.54, 0.3); tr.bus('fl', -0.15, 0.34, 0.45)
    tr.bus('fall', 0.4, 0.26, 0.5); tr.bus('gl', -0.45, 0.2, 0.55); tr.bus('str', -0.3, 0.26, 0.4)
    tr.bus('bass', 0, 0.76, 0.06); tr.bus('dr', 0, 0.62, 0.14)
    block(tr, 'org', organ, prog, [(0, 1.9), (2, 1.9)], octave=3, vel=0.4)
    block(tr, 'str', strings, prog, [(x * 0.25, 0.22) for x in range(16)], octave=4, vel=0.16, top=3)
    fall(tr, 'fall', bell, prog, octave=6, vel=0.28, dur=0.3)
    fall(tr, 'gl', glock, prog, octave=6, step=0.125, vel=0.16, dur=0.12)
    basses(tr, 'bass', bass, prog, EIGHTS, vel=0.7)
    melody(tr, 'br', brass, 0, NIGHT_MEL, octave=3, vel=0.6, tp=tp)
    melody(tr, 'fl', flute, 0, NIGHT_MEL, octave=4, vel=0.32, tp=tp)
    drums(tr, 'dr', {'kick': [0, 1.5, 2, 3.5], 'snare': [1, 3], 'hat': [(x * 0.5, 0.32) for x in range(8)],
                     'ohat': [(1.5, 0.3), (3.5, 0.3)], 'timp': [(0, 0.5), (2, 0.35)]}, 32)
    for b in range(3, 32, 4):
        roll(tr, 'dr', b, 0.5, 2.5 if b % 8 == 7 else 3.0)
    for b in (0, 8, 16, 24):
        tr.drum('dr', 'cym', b * 4, 0.6)
    return tr


SONGS = {'title': title, 'base': base, 'map1': map1, 'map2': map2, 'map3': map3, 'battle': battle, 'battle2': battle2, 'battle3': battle3, 'elite': elite,
         'boss1': boss1, 'boss2': boss2, 'dawn': dawn, 'victory': victory, 'result': result,
         'rest': rest, 'event': event, 'ep_daily': ep_daily, 'ep_warm': ep_warm, 'ep_tense': ep_tense,
         'tutorial': tutorial, 'dawn2': dawn2,
         'boss_queen': boss_queen, 'boss_whale': boss_whale, 'dawn3': dawn3,
         'season': season, 'boss_star': boss_star, 'boss_star3': boss_star3,
         'boss_canal': boss_canal, 'boss_bell': boss_bell, 'boss_bell2': boss_bell2, 'boss_ice': boss_ice,
         'boss_firstnight': boss_firstnight, 'boss_firstnight2': boss_firstnight2}
