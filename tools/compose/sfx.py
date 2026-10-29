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


# ---------- 적 행동 ----------

def boom():
    """적 자폭: 퓨즈 지지직 → 큰 폭발"""
    t = T(0.25)
    fuse = highpass(noise(0.25), 3000) * (0.2 + 0.3 * (np.sin(2 * np.pi * 30 * t) > 0)) * 0.3
    tb = T(0.9)
    blast = lowpass(noise(0.9), 1800) * np.exp(-tb / 0.25) * 0.9
    thump = np.sin(2 * np.pi * np.cumsum(40 + 120 * np.exp(-tb / 0.05)) / SR) * np.exp(-tb / 0.3)
    return verb(mix(fuse, at(mix(blast, thump), 0.22)), 1.2, 0.3)


def summon():
    """적이 부하를 부름: 올라가는 호각 + 발소리 둘"""
    call = sweep_tone(500, 1100, 0.3, 'sin') * np.exp(-T(0.3) / 0.25) * 0.3
    steps = mix(at(kick(0.4) * 0.5, 0.32), at(kick(0.4) * 0.5, 0.45))
    return verb(mix(call, at(call * 0.7, 0.12), steps), 0.8, 0.3)


def steal():
    """카드 훔치기: 휙 + 종이 + 낄낄 내려가는 음"""
    t = T(0.2)
    swish = highpass(noise(0.2), 1500) * np.sin(np.pi * t / 0.2) ** 2 * 0.4
    giggle = mix(*[at(square(n, 0.06, 0.25), i * 0.07) for i, n in enumerate((79, 76, 72))])
    return mix(swish, at(card() * 0.6, 0.1), at(giggle, 0.22))


def foe_heal():
    """적 회복: 탁한 물방울 셋"""
    return verb(mix(*[at(fm(n, 0.18, 0.3, ratio=2, index=1.5, idecay=0.1, a=0.005, d=0.2, s=0, r=0.1), i * 0.1)
                      for i, n in enumerate((60, 63, 67))]), 0.9, 0.35)


def retarget():
    """노림 바꾸기: 조준 찰칵 두 번"""
    c = mix(rim_click(), at(rim_click(), 0.12))
    return mix(c, at(square(88, 0.05, 0.25), 0.2))


def rim_click():
    t = T(0.05)
    return highpass(noise(0.05), 2500) * np.exp(-t / 0.008) * 0.6


def thorns():
    """가시에 찔림: 날카로운 찌직"""
    t = T(0.18)
    return mix(highpass(noise(0.18), 4000) * np.exp(-t / 0.04) * 0.5, square(91, 0.08, 0.3), at(square(85, 0.08, 0.25), 0.05))


# ---------- 화면 ----------

def flip():
    """보상 카드 뒤집기"""
    t = T(0.12)
    return mix(highpass(noise(0.12), 2000) * np.sin(np.pi * t / 0.12) * 0.35, at(glock(84, 0.1, 0.25), 0.06))


def constel():
    """별자리 차오름: 별 다섯 개가 이어지는 종"""
    return verb(mix(*[at(bell(n, 0.4, 0.35), i * 0.08) for i, n in enumerate((79, 83, 86, 91, 95))]), 1.6, 0.45)


def burst():
    """패시브 폭발(이름 띠): 금관 한 방 + 심벌 + 쿵"""
    hornf = mix(*[brass(n, 0.45, 0.45) for n in (62, 69, 74, 78)])
    return verb(mix(at(kick(0.9), 0), hornf, at(snare(0.6), 0.02), lowpass(highpass(noise(0.6), 3000), 9000) * np.exp(-T(0.6) / 0.2) * 0.3), 1.2, 0.3)


def fanfare5():
    """★5 소환 징글: 하늘이 갈라지는 종 + 금관 팡파르 (약 2.5초)"""
    rise = mix(*[at(glock(n, 0.15, 0.3), i * 0.06) for i, n in enumerate((72, 76, 79, 84, 88, 91, 96))])
    notes = [(0.5, 72, 0.15), (0.66, 76, 0.15), (0.82, 79, 0.15), (1.0, 84, 0.9)]
    fan = mix(*[at(brass(n, d, 0.55), st) for st, n, d in notes])
    chord_ = at(mix(*[brass(n, 1.2, 0.38) for n in (60, 67, 72, 76, 79)]), 1.0)
    return verb(mix(rise, fan, chord_, at(timpani(0.6, 36), 1.0), at(bell(96, 1.0, 0.35), 1.0)), 2.2, 0.4)


SFX = {'click': click, 'select': select, 'card': card, 'get': get, 'move': move, 'turn': turn,
       'slash': slash, 'hit': hit, 'cannon': cannon, 'block': block, 'poison': poison, 'spirit': spirit, 'mana': mana,
       'clock': clock, 'duo': duo, 'chain1': chain1, 'chain2': chain2, 'chain3': chain3,
       'hurt': hurt, 'down': down, 'heal': heal, 'foe_down': foe_down,
       'win': win, 'lose': lose, 'dawn': dawn, 'star': star,
       'boom': boom, 'summon': summon, 'steal': steal, 'foe_heal': foe_heal, 'retarget': retarget, 'thorns': thorns,
       'flip': flip, 'constel': constel, 'burst': burst, 'fanfare5': fanfare5}


# ---------- 동료별 공격음 (atk_<id>) ----------
# 공격 갈래(베기·포격·별·안개·마법·타격·찌르기) 바탕 위에 동료마다 음높이(n)·길이(ln)·파형(w: fm 비율/사각 듀티)을 조금씩 바꾼다.
# 같은 갈래끼리도 귀로 구별되게: 칼날 울림 음, 꼬리 길이, 덧붙는 FM 한 음이 다르다.

def tone(n, dur, vel, w):
    """w: 숫자면 FM 모듈레이터 비율, 'sq'/'pu'면 사각(50%/25%) 펄스."""
    if w == 'sq':
        return square(n, dur, vel)
    if w == 'pu':
        return square(n, dur, vel, 0.25)
    return fm(n, dur, vel, ratio=w, index=2.2, idecay=dur * 0.5, a=0.001, d=dur, s=0, r=dur * 0.6)


def a_slash(n, ln, w, hp=2500):
    t = T(0.12 + ln)
    whoosh = highpass(noise(0.12 + ln), hp) * np.exp(-((t - 0.04) / (0.03 + ln * 0.15)) ** 2) * 0.7
    return mix(whoosh, at(tone(n, 0.04 + ln * 0.3, 0.4, w), 0.04))


def a_boom(n, ln, w):
    t = T(0.5 + ln)
    f0 = hz(n) / 8
    body = np.sin(2 * np.pi * np.cumsum(f0 + 110 * np.exp(-t / 0.05)) / SR) * np.exp(-t / (0.15 + ln * 0.4))
    blast = lowpass(noise(0.5 + ln), 1600) * np.exp(-t / (0.08 + ln * 0.15)) * 0.8
    return verb(mix(body * 1.1, blast, at(tone(n, 0.05, 0.25, w), 0.0)), 0.6 + ln, 0.25)


def a_star(n, ln, w):
    notes = (n, n + 4, n + 7, n + 12)
    return verb(mix(*[at(tone(m, 0.05 + ln * 0.2, 0.35, w), i * (0.03 + ln * 0.05)) for i, m in enumerate(notes)],
                    highpass(noise(0.15), 5000) * np.exp(-T(0.15) / 0.04) * 0.2), 0.8 + ln, 0.35)


def a_mist(n, ln, w):
    t = T(0.25 + ln)
    hiss = lowpass(highpass(noise(0.25 + ln), 1200), 5000) * np.sin(np.pi * t / (0.25 + ln)) ** 2 * 0.35
    drop = mix(*[at(tone(m, 0.05, 0.3, w), i * 0.05) for i, m in enumerate((n, n - 5, n - 9))])
    return mix(hiss, at(lowpass(drop, 3500), 0.03))


def a_magic(n, ln, w):
    a = fm(n, 0.1 + ln, 0.4, ratio=w if isinstance(w, (int, float)) else 2, index=1.8, idecay=0.08 + ln * 0.3,
           a=0.004, d=0.2 + ln, s=0, r=0.15 + ln * 0.3, vib=0.01)
    up = sweep_tone(hz(n - 12), hz(n + 12), 0.08 + ln * 0.3, 'sin') * np.exp(-T(0.08 + ln * 0.3) / 0.1) * 0.25
    return verb(mix(a, up, at(tone(n + 7, 0.05, 0.25, w), 0.05 + ln * 0.2)), 0.7 + ln, 0.3)


def a_impact(n, ln, w):
    t = T(0.18 + ln)
    body = np.sin(2 * np.pi * np.cumsum(hz(n) / 4 + 150 * np.exp(-t / 0.025)) / SR) * np.exp(-t / (0.05 + ln * 0.3))
    crack = highpass(noise(0.18 + ln), 1500) * np.exp(-t / 0.018) * 0.5
    return mix(body * 0.9, crack, at(tone(n, 0.03 + ln * 0.2, 0.25, w), 0.01))


def a_pierce(n, ln, w):
    zip_ = sweep_tone(hz(n + 12), hz(n), 0.06 + ln * 0.2, 'sq') * np.exp(-T(0.06 + ln * 0.2) / 0.05) * 0.25
    t = T(0.12)
    stab = highpass(noise(0.12), 3000) * np.exp(-t / 0.015) * 0.6
    return mix(lowpass(zip_, 5000), at(stab, 0.04), at(tone(n, 0.05 + ln * 0.2, 0.35, w), 0.05))


ATK_KIND = {'slash': a_slash, 'boom': a_boom, 'star': a_star, 'mist': a_mist, 'magic': a_magic, 'impact': a_impact, 'pierce': a_pierce}
# id: (갈래, 음높이 midi, 길이(초, 꼬리 늘림), 파형)
ATK = {
    'iris': ('slash', 96, 0.10, 3.01),       # 맑고 곧은 칼날
    'akane': ('slash', 91, 0.35, 1.41),      # 홍련: 낮고 길게 타오르는 울림
    'laila': ('slash', 100, 0.05, 'pu'),     # 바람 칼: 가볍고 높게
    'mimimomo': ('slash', 103, 0.03, 'sq'),  # 쌍둥이: 짧고 통통
    'sebas': ('slash', 98, 0.08, 4.0),       # 은 식기처럼 쨍
    'brick': ('boom', 55, 0.45, 'sq'),       # 큰 대포
    'mariana': ('boom', 62, 0.30, 1.5),      # 해적 권총·작은 포
    'fukuro': ('boom', 70, 0.15, 'pu'),      # 폭죽
    'sion': ('star', 84, 0.15, 5.0),         # 별 정령
    'raven': ('mist', 72, 0.20, 2.5),        # 흑우·독
    'marta': ('impact', 60, 0.20, 3.53),     # 철퇴 + 종
    'zeno': ('impact', 50, 0.30, 1.0),       # 무거운 흑검
    'gordon': ('impact', 65, 0.10, 'sq'),    # 프라이팬
    'dora': ('impact', 72, 0.15, 3.53),      # 망치·모루
    'finn': ('impact', 77, 0.05, 'pu'),      # 가벼운 가방 휘두르기
    'bertha': ('impact', 69, 0.12, 2.0),     # 지팡이
    'sigrun': ('pierce', 86, 0.15, 2.0),     # 창
    'noel': ('magic', 76, 0.15, 2.0),        # 마술
    'lunaria': ('magic', 81, 0.35, 1.5),     # 달빛: 길게
    'eleonore': ('magic', 69, 0.30, 3.5),    # 시계탑: 종 같은 낮은 울림
    'tomori': ('magic', 88, 0.08, 'pu'),     # 등대 불빛: 짧고 높게
    'nerea': ('magic', 72, 0.40, 1.0),       # 물보라: 둥글고 길게
}


def _atk(cid):
    kind, n, ln, w = ATK[cid]
    return lambda: ATK_KIND[kind](n, ln, w)


SFX.update({f'atk_{cid}': _atk(cid) for cid in ATK})
