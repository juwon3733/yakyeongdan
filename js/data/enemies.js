// 적 (docs/04_enemies.md). pat = 행동 순환, aim = 단일 공격이 노리는 동료(rules.js AIM_NAME, 없으면 앞줄).
const A = (v, n = 1) => ({ t: 'atk', v, n }), B = v => ({ t: 'blk', v }), U = v => ({ t: 'buf', v }), M = (v, b) => ({ t: 'mix', v, b });

export const FOE_PAL = {
  sea:    { h: '#6ad0e0', H: '#2a8aa0', e: '#ffffff', o: '#2a5a7a', O: '#163a52', a: '#a8f0ff' },
  crab:   { h: '#d05a3a', H: '#8a2a1a', e: '#ffe080', o: '#a0402a', O: '#601e10', a: '#f0c0a0' },
  pirate: { h: '#3a2a1a', H: '#1a120a', e: '#e0e0e0', o: '#6a2a2a', O: '#3a1414', a: '#e0b84a' },
  cloud:  { h: '#e8f0ff', H: '#a0b0d0', e: '#5a8ae0', o: '#c0d0f0', O: '#8090b8', a: '#ffffff' },
  knight: { h: '#c8c0a0', H: '#8a8060', e: '#3a5a8a', o: '#e0e0e8', O: '#9a9aa8', a: '#e0b84a' },
  star:   { h: '#1a1a3a', H: '#0a0a1e', e: '#ffe080', o: '#3a3a7a', O: '#22224a', a: '#ffe080', skin: '#c0c0d8' },
  cat:    { h: '#141418', H: '#08080a', e: '#a0ff80', o: '#202028', O: '#101014', a: '#a0ff80', skin: '#c0c0d8' },
  dawn:   { h: '#ffd0a0', H: '#e08a5a', e: '#ff5a3a', o: '#ffe8d0', O: '#e0b090', a: '#ff8a3a' },
};

export const FOES = {
  1: { fight: [ { name: '바다 유령', hp: 24, pal: 'sea', long: true, pat: [A(7), A(4, 2), A(9)] },
                { name: '게 갑옷병', hp: 30, pal: 'crab', pat: [B(8), A(9), M(5, 5)] },
                { name: '부두 해적', aim: 'back', hp: 26, pal: 'pirate', pat: [A(6), U(2), A(3, 3)] } ],
       elite: { name: '닻 거인', hp: 60, pal: 'pirate', pat: [A(14), B(10), A(6, 2), U(3)] },
       boss:  { name: '등대지기', aim: 'last', hp: 95, pal: 'sea', long: true, crown: true, pat: [A(8), M(10, 8), A(5, 3), U(3)] } },
  2: { fight: [ { name: '구름 정령', hp: 34, pal: 'cloud', long: true, pat: [A(5, 2), B(10), A(12)] },
                { name: '깃털 기사', hp: 40, pal: 'knight', pat: [A(11), M(7, 7), U(3)] },
                { name: '천둥 양', aim: 'weakest', hp: 36, pal: 'cloud', pat: [A(4, 3), A(10)] } ],
       elite: { name: '번개새', aim: 'back', hp: 80, pal: 'knight', long: true, pat: [A(6, 3), U(3), A(18)] },
       boss:  { name: '구름 기사단장', hp: 140, pal: 'knight', long: true, crown: true, pat: [M(12, 12), A(7, 3), U(4), A(22)] } },
  3: { fight: [ { name: '별 조각상', hp: 50, pal: 'star', pat: [B(15), A(16)] },
                { name: '그림자 고양이', aim: 'back', hp: 44, pal: 'cat', long: true, pat: [A(5, 4), U(3)] },
                { name: '유성 사수', aim: 'back', hp: 48, pal: 'star', long: true, pat: [A(9, 2), A(18)] } ],
       elite: { name: '유성 기수', hp: 100, pal: 'star', crown: true, pat: [A(8, 3), M(14, 14), U(4)] },
       boss:  { name: '새벽', aim: 'weakest', hp: 190, pal: 'dawn', long: true, crown: true, pat: [A(12), A(6, 4), M(16, 16), U(5), A(28)] } },
};
