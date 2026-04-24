# NWK — Lighthouse 측정 가이드

> 공모전 제안서 부록용 Lighthouse 4개 지표(Performance / Accessibility / Best Practices / SEO) 스크린샷 확보 절차.

## 왜 필요한가

1차 심사 **완성도 30점** 중 "기능성·안정성·편의성"에 Lighthouse 점수가 정량 근거로 작용합니다. 제안서에 실측 스크린샷을 넣으면 심사위원이 성능 질문을 별도로 물을 필요가 없어집니다.

---

## 방법 1: Chrome DevTools (가장 간단, 권장)

### 데스크톱 측정

1. Chrome에서 `https://nwkorea.com/` 접속
2. DevTools 열기 (`F12` 또는 `Cmd+Opt+I`)
3. `Lighthouse` 탭 선택 (원형 시계 아이콘)
4. 설정:
   - **Mode**: Navigation
   - **Device**: **Desktop**
   - **Categories**: Performance + Accessibility + Best Practices + SEO 모두 체크 (PWA는 선택)
5. `Analyze page load` 클릭
6. 보고서 완료 후 우상단 **다운로드 버튼** → **Save as HTML** 또는 **Save as JSON**
7. 상단 4개 원형 점수 캡처 (1600px 이상 권장)

### 모바일 측정

동일 절차에서 **Device**를 **Mobile**로 변경. 점수는 데스크톱보다 낮게 나옴(모바일 네트워크·CPU 시뮬레이션). 둘 다 제출 권장.

### 권장 점수 목표

| 지표           | 목표 | 제출 커트 |
| -------------- | ---- | --------- |
| Performance    | 90+  | 80+       |
| Accessibility  | 95+  | 90+       |
| Best Practices | 95+  | 90+       |
| SEO            | 100  | 95+       |

NWK 현재 기준 예상:

- Desktop: Performance 92~98 / A11y 96+ / Best Practices 100 / SEO 100
- Mobile: Performance 75~88 (Kakao SDK·TourAPI 프록시 지연) / 나머지 동일

---

## 방법 2: CLI (자동화)

CI 또는 로컬에서 스크립트로 돌려 JSON 저장.

```bash
npm install -g @lhci/cli

# 단일 측정
lhci collect --url=https://nwkorea.com/ --settings.preset=desktop --numberOfRuns=1

# 4개 카테고리 리포트 json 저장
npx lighthouse https://nwkorea.com/ \
  --preset=desktop \
  --output=json \
  --output=html \
  --output-path=./lighthouse-desktop \
  --only-categories=performance,accessibility,best-practices,seo \
  --chrome-flags="--headless"
```

결과물:

- `lighthouse-desktop.report.html` — 브라우저에서 열어 캡처
- `lighthouse-desktop.report.json` — 점수만 `jq` 로 추출 가능

모바일 버전:

```bash
npx lighthouse https://nwkorea.com/ \
  --preset=perf \
  --output=html \
  --output-path=./lighthouse-mobile \
  --only-categories=performance,accessibility,best-practices,seo \
  --chrome-flags="--headless --no-sandbox"
```

---

## 방법 3: PageSpeed Insights 웹 (브라우저만)

1. https://pagespeed.web.dev/ 접속
2. URL 입력: `https://nwkorea.com/`
3. Analyze → 데스크톱·모바일 점수 둘 다 표시
4. 스크린샷 캡처 (점수 부분만 잘라서 사용)

장점: 설치 불필요. 단점: 수동 반복 측정 어려움.

---

## 점수 개선 우선순위 (90점 미만이면 확인)

### Performance

1. **이미지 lazy loading** — 이미 `loading="lazy"` 적용됐는지 확인
2. **`/thumb` 프록시 활용** — TourAPI 이미지는 모두 WebP 프록시 경유 중 (완료)
3. **rolldown 번들 분석** — `npm run build` 후 `dist/` 크기 확인. 400KB 이상 청크 있으면 dynamic import 검토
4. **폰트 preload** — 시스템 폰트 쓰고 있어 영향 미미

### Accessibility

1. 검색 input `aria-label` (이전 감사에서 지적됨 — 필요 시 추가)
2. 버튼 텍스트 색 대비 (WCAG AA 4.5:1 이상) — 현재 테마는 대부분 통과
3. 이미지 `alt` — 장식용은 `alt=""` 명시 (완료)

### Best Practices

1. HTTPS — Firebase Hosting 자동 (완료)
2. `console.error` 없는 상태 — 현재 publicChecks subscription 에러 로깅 외엔 clean
3. 외부 리소스 mixed content 없음 — TourAPI 이미지는 `httpsify` 처리 완료

### SEO

1. `<title>`, `meta description`, `robots.txt`, `sitemap.xml` — 모두 완료
2. `hreflang` 4개 언어 명시 — 완료
3. JSON-LD structured data (WebSite + MobileApplication) — 완료

---

## 제안서 부록 배치 제안

**5페이지 본문 뒤에 별첨 1페이지** 또는 p4(완성도) 우측 사이드바:

```
┌───────────────────────────────┐
│  Lighthouse Audit (2026-MM-DD)│
│  Desktop  / Mobile             │
│  Performance   95  /  82       │
│  Accessibility 98  /  98       │
│  Best Practices 100 / 100      │
│  SEO           100  / 100      │
│                                │
│  측정 URL: https://nwkorea.com │
│  [QR 코드]                     │
└───────────────────────────────┘
```

## 측정 체크리스트

- [ ] Desktop 4개 지표 캡처 완료
- [ ] Mobile 4개 지표 캡처 완료
- [ ] 측정 일자·URL 기록
- [ ] 점수 90점 미만 항목에 대한 개선 노트 작성 (있으면)
- [ ] 스크린샷 파일명 `lighthouse-desktop-20260501.png`, `lighthouse-mobile-20260501.png`
