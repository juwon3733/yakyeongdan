"""야경단 효과음. 모두 짧은 모노 신호(-1~1)."""
import numpy as np
from synth import SR, RNG, fm, bell, glock, square, brass, lowpass, highpass, hz, kick, reverb, timpani, snare


def T(sec):
    return np.arange(int(sec * SR)) / SR


def cat(*xs):
    return np.concatenate(xs)


def mix(*xs):
    n = max(len(x) for x in xs)
    out = np.zeros(n)
    for x in xs:
        out[: len(x)] += x
    return out


def at(x, sec):
    return cat(np.zeros(int(sec * SR)), x)


def verb(x, sec=0.8, mix_=0.25):
    st = np.stack([x, x], axis=1)
    return reverb(st, sec, mix=mix_)[:, 0]


def noise(sec):
    return RNG.standard_normal(int(sec * SR))


def sweep_tone(f0, f1, sec, shape='sq'):
    t = T(sec)
    f = f0 + (f1 - f0) * t / sec
    ph = np.cumsum(f) / SR
    return np.where(ph % 1 < 0.5, 1.0, -1.0) if shape == 'sq' else np.sin(2 * np.pi * ph)


# ---------- 화면·고르기 ----------

def click():
    t = T(0.03)
    return np.where((hz(84) * t) % 1 < 0.5, 1.0, -1.0) * np.exp(-t / 0.008) * 0.3


def select():
    return mix(square(81, 0.04, 0.45), at(square(88, 0.06, 0.45), 0.045))


def card():
    """카드를 내려놓는 종이 소리 + 가벼운 툭"""
    t = T(0.18)
    paper = lowpass(highpass(noise(0.18), 900), 6000) * np.sin(np.pi * np.clip(t / 0.18, 0, 1)) ** 2 * 0.45
    tap = np.sin(2 * np.pi * 220 * t) * np.exp(-t / 0.03) * 0.35
    return mix(paper, at(tap, 0.08))


def get():
    """보상 카드를 덱에 넣음"""
    return verb(mix(glock(84, 0.1, 0.45), at(glock(88, 0.1, 0.4), 0.06), at(glock(91, 0.25, 0.45), 0.12)), 0.8, 0.3)


def move():
    """지도에서 다음 칸으로: 계단 두 걸음"""
    t = T(0.08)
    st = lowpass(noise(0.08), 1300) * np.exp(-t / 0.016) * 0.55
    return mix(st, at(st * 0.8, 0.16))


def turn():
    """내 턴 시작"""
    return verb(mix(fm(79, 0.12, 0.4, ratio=1, index=0.8, idecay=0.1, a=0.002, d=0.4, s=0, r=0.2),
                    at(fm(86, 0.2, 0.4, ratio=1, index=0.8, idecay=0.1, a=0.002, d=0.5, s=0, r=0.3), 0.09)), 0.6, 0.2)


# ---------- 공격·방어·상태 ----------

def slash():
    """베기: 짧게 휘두르는 바람 + 칼날 울림"""
    t = T(0.3)
    whoosh = highpass(noise(0.3), 2500) * np.exp(-((t - 0.05) / 0.04) ** 2) * 0.7
    ring = fm(96, 0.05, 0.35, ratio=3.01, index=2.5, idecay=0.03, a=0.001, d=0.15, s=0, r=0.12)
    return mix(whoosh, at(ring, 0.05))


def hit():
    """일반 타격"""
    t = T(0.25)
    body = np.sin(2 * np.pi * np.cumsum(90 + 140 * np.exp(-t / 0.03)) / SR) * np.exp(-t / 0.08)
    crack = highpass(noise(0.25), 1500) * np.exp(-t / 0.02) * 0.5
    return mix(body * 0.9, crack)


def cannon():
    """브릭 포격: 펑 + 낮게 울리는 꼬리"""
    t = T(1.2)
    boom = np.sin(2 * np.pi * np.cumsum(40 + 90 * np.exp(-t / 0.06)) / SR) * np.exp(-t / 0.35)
    blast = lowpass(noise(1.2), 1800) * np.exp(-t / 0.12) * 0.9
    return verb(mix(boom * 1.2, blast, kick(0.8)), 1.4, 0.3)


def block():
    """방어: 쇠 방패에 맞는 쨍"""
    clang = fm(76, 0.05, 0.6, ratio=3.53, index=3.0, idecay=0.08, a=0.001, d=0.35, s=0, r=0.25)
    t = T(0.12)
    thud = lowpass(noise(0.12), 700) * np.exp(-t / 0.025) * 0.5
    return verb(mix(clang, thud), 0.6, 0.2)


def poison():
    """독: 보글보글 내려가는 방울"""
    out = []
    for i, n in enumerate((79, 74, 70, 67)):
        t = T(0.07)
        f = hz(n) * (1 + 0.6 * np.exp(-t / 0.015))
        out.append(at(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.03) * 0.5, i * 0.055))
    return lowpass(mix(*out), 3000)


def spirit():
    """별 정령 부르기: 위로 퍼지는 반짝임"""
    return verb(mix(*[at(glock(n, 0.08, 0.35), i * 0.04) for i, n in enumerate((84, 88, 91, 96, 100))]), 1.2, 0.4)


def mana():
    """노엘 마력·잠: 느리게 숨 쉬는 낮은 음"""
    a = fm(67, 0.4, 0.35, ratio=2, index=0.8, idecay=0.3, a=0.08, d=0.5, s=0.3, r=0.3, vib=0.01)
    b = fm(74, 0.4, 0.25, ratio=2, index=0.8, idecay=0.3, a=0.08, d=0.5, s=0.3, r=0.3, vib=0.01)
    return verb(mix(a, at(b, 0.18)), 1.0, 0.35)


def clock():
    """시간 카드: 째깍째깍 넷 + 종 하나 (밤 시계가 앞으로 간다)"""
    t = T(0.03)
    tk = np.sin(2 * np.pi * 2600 * t) * np.exp(-t / 0.005) * 0.5
    tc = np.sin(2 * np.pi * 1900 * t) * np.exp(-t / 0.006) * 0.5
    ticks = mix(tk, at(tc, 0.09), at(tk, 0.18), at(tc, 0.27))
    return verb(mix(ticks, at(bell(81, 0.3, 0.45), 0.36)), 1.0, 0.3)


def duo():
    """듀오: 두 사람의 음이 겹치는 화음 + 반짝임"""
    a = mix(*[brass(n, 0.45, 0.45) for n in (60, 67, 72)])
    b = mix(*[brass(n, 0.6, 0.45) for n in (64, 71, 76)])
    shine = highpass(noise(0.5), 5000) * np.exp(-T(0.5) / 0.15) * 0.2
    return verb(mix(a, at(b, 0.12), at(shine, 0.12), at(glock(96, 0.3, 0.3), 0.2)), 1.4, 0.35)


def chain1():
    return verb(glock(84, 0.12, 0.5), 0.6, 0.25)


def chain2():
    return verb(mix(glock(88, 0.12, 0.5), at(glock(84, 0.1, 0.25), 0.0)), 0.6, 0.25)


def chain3():
    return verb(mix(glock(91, 0.2, 0.55), glock(84, 0.15, 0.25), glock(88, 0.15, 0.25)), 0.8, 0.3)


def hurt():
    """동료가 맞음"""
    return lowpass(mix(sweep_tone(330, 150, 0.16) * np.exp(-T(0.16) / 0.08) * 0.35, hit() * 0.5), 3500)


def down():
    """동료가 쓰러짐: 내려가는 음 + 쿵"""
    t = T(0.6)
    fall = sweep_tone(440, 110, 0.6) * np.exp(-t / 0.35) * 0.3
    thud = np.sin(2 * np.pi * np.cumsum(50 + 70 * np.exp(-T(0.5) / 0.04)) / SR) * np.exp(-T(0.5) / 0.15)
    return verb(mix(lowpass(fall, 2500), at(thud, 0.45)), 1.0, 0.3)


def heal():
    return verb(mix(*[at(fm(n, 0.25, 0.35, ratio=1, index=0.5, idecay=0.4, a=0.03, d=0.6, s=0, r=0.4), i * 0.09)
                      for i, n in enumerate((72, 76, 79, 84))]), 1.2, 0.35)


def foe_down():
    """적을 쓰러뜨림"""
    t = T(0.7)
    shatter = highpass(noise(0.7), 2000) * np.exp(-t / 0.15) * 0.5
    return verb(mix(hit(), at(shatter, 0.03), at(glock(79, 0.2, 0.3), 0.1)), 1.0, 0.3)


# ---------- 짧은 곡 ----------

def win():
    """전투 승리 팡파르"""
    notes = [(0.0, 72, 0.12), (0.13, 72, 0.12), (0.26, 72, 0.12), (0.4, 76, 0.5)]
    fan = mix(*[at(brass(n, d, 0.55), s) for s, n, d in notes])
    chord_ = at(mix(*[brass(n, 0.7, 0.4) for n in (67, 72, 76, 79)]), 0.9)
    return verb(mix(fan, chord_, at(snare(0.4), 0.9)), 1.4, 0.3)


def lose():
    """판에서 짐"""
    notes = [(0.0, 69, 0.35), (0.35, 68, 0.35), (0.7, 67, 0.35), (1.05, 62, 1.0)]
    return verb(mix(*[at(fm(n, d, 0.45, ratio=1, index=1.2, idecay=0.3, a=0.02, d=0.8, s=0.4, r=0.4), s) for s, n, d in notes]), 1.8, 0.35)


def dawn():
    """6시: 탑 위에서 울리는 큰 종"""
    toll = fm(48, 2.0, 0.8, ratio=2.76, index=3.0, idecay=1.0, a=0.002, d=3.0, s=0, r=1.5)
    hi = fm(60, 1.5, 0.35, ratio=3.5, index=2.0, idecay=0.6, a=0.002, d=2.0, s=0, r=1.0)
    return verb(mix(toll, hi, timpani(0.4, 36)), 3.0, 0.45)


def star():
    """별 소환: 별똥별이 떨어지는 소리 (본부 소환 화면용)"""
    t = T(0.9)
    fall = np.sin(2 * np.pi * np.cumsum(2400 * np.exp(-t / 0.4) + 400) / SR) * np.exp(-t / 0.5) * 0.25
    return verb(mix(fall, at(bell(91, 0.4, 0.5), 0.7), at(bell(96, 0.6, 0.4), 0.78)), 1.8, 0.45)


SFX = {'click': click, 'select': select, 'card': card, 'get': get, 'move': move, 'turn': turn,
       'slash': slash, 'hit': hit, 'cannon': cannon, 'block': block, 'poison': poison, 'spirit': spirit, 'mana': mana,
       'clock': clock, 'duo': duo, 'chain1': chain1, 'chain2': chain2, 'chain3': chain3,
       'hurt': hurt, 'down': down, 'heal': heal, 'foe_down': foe_down,
       'win': win, 'lose': lose, 'dawn': dawn, 'star': star}
