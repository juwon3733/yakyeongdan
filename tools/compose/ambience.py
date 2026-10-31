"""환경음. 이음매 없이 반복되는 모노 루프(-1~1). 배경음악 아래에 아주 작게 깐다.
sea = 1막 항구층(파도), wind = 2막 구름층(바람), tower = 3막 별층·탑 안(낮은 웅웅거림과 먼 쇠 울림).
harbor_town·convent·clock = 에피소드 장소, campfire = 휴식, canal = 2장 운하 도시, icesea = 3장 별바다 끝."""
import numpy as np
from synth import SR, RNG, lowpass, highpass

LEN = 16.0  # 초


def T(sec=LEN):
    return np.arange(int(sec * SR)) / SR


def noise(sec=LEN):
    return RNG.standard_normal(int(sec * SR))


def loop(x, fade=1.5):
    """끝 fade초를 앞쪽에 겹쳐 이음매를 없앤다 (결과 길이 = LEN)"""
    n = int(fade * SR)
    head, body, tail = x[:n], x[n:-n], x[-n:]
    w = np.linspace(0, 1, n)
    return np.concatenate([head * w + tail * (1 - w), body])


def slow(t, period, lo=0.3, hi=1.0, phase=0.0):
    """루프 길이에 딱 맞게 도는 느린 흔들림"""
    k = max(1, round(LEN / period))
    return lo + (hi - lo) * (0.5 + 0.5 * np.sin(2 * np.pi * k * t / LEN + phase))


def sea():
    """밤 항구: 파도가 밀려왔다 빠지는 소리 + 낮은 바닷바람"""
    t = T(LEN + 1.5)
    waves = lowpass(noise(LEN + 1.5), 650) * slow(t, 5.3, 0.12, 1.0) * 0.6
    foam = lowpass(highpass(noise(LEN + 1.5), 1800), 5000) * slow(t, 5.3, 0.0, 0.25, 0.6) * 0.3
    wind = lowpass(highpass(noise(LEN + 1.5), 200), 1100) * slow(t, 8, 0.2, 0.45, 1.3) * 0.22
    return loop(waves + foam + wind)


def wind():
    """구름층: 높은 곳의 바람. 휘파람 같은 띠 소리가 오르내린다"""
    t = T(LEN + 1.5)
    base = lowpass(highpass(noise(LEN + 1.5), 300), 1500) * slow(t, 4, 0.25, 1.0) * 0.45
    gust = lowpass(highpass(noise(LEN + 1.5), 900), 2600) * slow(t, 2.7, 0.0, 0.6, 2.0) * 0.25
    k = round(LEN * 0.5) / LEN
    whistle = np.sin(2 * np.pi * (620 * t + 80 / (2 * np.pi * k) * -np.cos(2 * np.pi * k * t))) * slow(t, 5.3, 0.0, 0.05, 0.9)
    return loop(base + gust + whistle)


def tower():
    """탑 안·별층: 낮은 웅웅거림 + 아주 가끔 먼 쇠 울림"""
    t = T(LEN + 1.5)
    k = round(LEN * 55) / LEN
    drone = (np.sin(2 * np.pi * k * t) + 0.5 * np.sin(2 * np.pi * 1.5 * k * t) + 0.25 * np.sin(2 * np.pi * 2 * k * t)) * slow(t, 8, 0.5, 1.0) * 0.12
    air = lowpass(noise(LEN + 1.5), 350) * 0.16
    clank = np.zeros_like(t)
    for s in (3.1, 9.4, 13.7):
        i = int(s * SR)
        n = int(1.6 * SR)
        tt = np.arange(n) / SR
        clank[i:i + n] += (np.sin(2 * np.pi * 410 * tt) + 0.6 * np.sin(2 * np.pi * 1093 * tt)) * np.exp(-tt / 0.45) * 0.05
    return loop(drone + air + lowpass(clank, 3000))


def hits(t, times, fn, dur):
    """times(초)마다 fn(tt)를 더한 소리. 루프 끝 겹침 구간(LEN~LEN+1.5)은 피해서 놓는다"""
    out = np.zeros_like(t)
    n = int(dur * SR)
    tt = np.arange(n) / SR
    for s in times:
        i = int(s * SR)
        m = min(n, len(t) - i)
        out[i:i + m] += fn(tt)[:m]
    return out


def tone(tt, f, decay, partials=((1, 1.0),)):
    return sum(a * np.sin(2 * np.pi * f * r * tt) for r, a in partials) * np.exp(-tt / decay)


def crackle(t, rate, seed, lo=1500, hi=7000, decay=0.004, amp=1.0):
    """타닥: 짧은 딸깍들을 무작위로 흩뿌린다"""
    rng = np.random.default_rng(seed)
    out = np.zeros_like(t)
    n = int(0.03 * SR)
    tt = np.arange(n) / SR
    for s in rng.uniform(0.05, LEN - 0.1, int(rate * LEN)):
        i = int(s * SR)
        click = rng.standard_normal(n) * np.exp(-tt / (decay * rng.uniform(0.5, 2.0))) * rng.uniform(0.2, 1.0) ** 2
        out[i:i + n] += click
    return lowpass(highpass(out, lo), hi) * amp


def harbor_town():
    """항구 거리: 잔잔한 파도 + 멀리서 울리는 종"""
    t = T(LEN + 1.5)
    waves = lowpass(noise(LEN + 1.5), 500) * slow(t, 4, 0.15, 0.7) * 0.5
    lap = lowpass(highpass(noise(LEN + 1.5), 1200), 3500) * slow(t, 4, 0.0, 0.18, 0.8) * 0.25
    bell = lambda tt: tone(tt, 523, 1.4, ((1, 1.0), (2.4, 0.45), (3.9, 0.2), (0.5, 0.3)))
    bells = hits(t, (2.0, 3.4, 10.0), bell, 4.0)
    return loop(waves + lap + lowpass(bells, 2500) * 0.07)


def convent():
    """수녀원: 촛불 타는 소리 + 낮은 오르간 울림"""
    t = T(LEN + 1.5)
    k = round(LEN * 65.4) / LEN   # C2 언저리
    organ = sum(a * np.sin(2 * np.pi * k * r * t) for r, a in ((1, 1.0), (1.5, 0.5), (2, 0.6), (3, 0.25), (4, 0.12)))
    organ = lowpass(organ, 900) * slow(t, 8, 0.35, 1.0) * 0.11
    flame = lowpass(highpass(noise(LEN + 1.5), 150), 700) * slow(t, 2.7, 0.5, 1.0, 0.4) * 0.12
    return loop(organ + flame + crackle(t, 3, 11, 2000, 6000, 0.003, 0.9))


def clock():
    """시계탑: 큰 톱니의 느린 째깍 + 탑 사이로 부는 바람"""
    t = T(LEN + 1.5)
    tick = lambda tt: (tone(tt, 180, 0.05, ((1, 1.0), (2.7, 0.5))) + tone(tt, 2400, 0.012) * 0.5)
    tock = lambda tt: (tone(tt, 140, 0.06, ((1, 1.0), (2.3, 0.5))) + tone(tt, 1900, 0.014) * 0.5)
    ticks = hits(t, np.arange(0.0, LEN, 2.0), tick, 0.4) + hits(t, np.arange(1.0, LEN, 2.0), tock, 0.4)
    groan = np.sin(2 * np.pi * (48 * t)) * slow(t, 16, 0.0, 1.0) * 0.04
    wind = lowpass(highpass(noise(LEN + 1.5), 250), 1300) * slow(t, 5.3, 0.2, 0.8, 1.1) * 0.3
    return loop(ticks * 0.35 + groan + wind)


def campfire():
    """모닥불: 낮게 타오르는 불 + 타닥 튀는 소리"""
    t = T(LEN + 1.5)
    roar = lowpass(highpass(noise(LEN + 1.5), 80), 500) * slow(t, 3.2, 0.5, 1.0) * 1.2
    pops = np.tanh(crackle(t, 9, 21, 1200, 7000, 0.004, 1.4) * 3) / 3
    snaps = np.tanh(crackle(t, 1.2, 22, 400, 4000, 0.012, 1.0) * 3) / 3
    return loop(roar + pops + snaps)


def canal():
    """운하 도시: 고인 물이 벽에 찰랑이는 소리 + 멀리서 도는 태엽"""
    t = T(LEN + 1.5)
    rng = np.random.default_rng(31)
    water = lowpass(noise(LEN + 1.5), 400) * slow(t, 3.2, 0.1, 0.45) * 0.4
    plip = lambda tt: np.sin(2 * np.pi * (700 + 900 * np.exp(-tt / 0.02)) * tt) * np.exp(-tt / 0.05)
    slosh = hits(t, np.sort(rng.uniform(0.2, LEN - 0.5, 14)), plip, 0.3) * 0.06
    wind_up = lambda tt: tone(tt, 3100, 0.008) + tone(tt, 1700, 0.01) * 0.4
    winder = hits(t, [s + i * 0.11 for s in (4.0, 11.5) for i in range(12)], wind_up, 0.1)
    return loop(water + slosh + lowpass(winder, 3000) * 0.08)


def icesea():
    """별바다 끝: 차갑고 높은 바람 + 얼음이 삐걱이는 소리"""
    t = T(LEN + 1.5)
    base = lowpass(highpass(noise(LEN + 1.5), 500), 2600) * slow(t, 5.3, 0.3, 1.0) * 0.4
    hiss = highpass(noise(LEN + 1.5), 4000) * slow(t, 3.2, 0.05, 0.25, 1.7) * 0.15
    creak = lambda tt: np.sin(2 * np.pi * (90 * tt + 25 * tt ** 2) + 3 * np.sin(2 * np.pi * 11 * tt)) * np.sin(np.pi * np.clip(tt / 1.2, 0, 1)) ** 2
    creaks = hits(t, (2.5, 8.8, 13.2), creak, 1.2)
    ping = lambda tt: tone(tt, 2900, 0.25, ((1, 1.0), (1.37, 0.5)))
    pings = hits(t, (6.1, 12.0), ping, 1.0)
    return loop(base + hiss + lowpass(creaks, 1500) * 0.12 + pings * 0.03)


AMB = {'sea': sea, 'wind': wind, 'tower': tower, 'harbor_town': harbor_town, 'convent': convent, 'clock': clock,
       'campfire': campfire, 'canal': canal, 'icesea': icesea}
