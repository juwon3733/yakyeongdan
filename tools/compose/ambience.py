"""환경음. 이음매 없이 반복되는 모노 루프(-1~1). 배경음악 아래에 아주 작게 깐다.
sea = 1막 항구층(파도), wind = 2막 구름층(바람), tower = 3막 별층·탑 안(낮은 웅웅거림과 먼 쇠 울림)."""
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


AMB = {'sea': sea, 'wind': wind, 'tower': tower}
