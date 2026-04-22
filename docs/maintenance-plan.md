# NWK 운영·유지보수 플랜

라이브 서비스: https://nwkorea.com (기본 Firebase Hosting: `nwk-app-ba6f8.web.app`)

서비스 오픈 이후 데이터·코드가 계속 신선하게 유지되도록 분기별 루틴과 담당 책임을 명시한다. 공모전 제출 이후에도 이 문서를 기준으로 주기적 점검을 진행한다.

---

## 1. 책임 범위

| 영역              | 책임자      | 백업        | 비고                                         |
| ----------------- | ----------- | ----------- | -------------------------------------------- |
| 제품(코드·디자인) | mini5031    | —           | GitHub `mini531/nwk` 저장소 관리             |
| 코스·POI 큐레이션 | mini5031    | 관리자 계정 | `/admin/courses` 토글 + Firestore `courses/` |
| 공공데이터 갱신   | mini5031    | —           | 분기별 CPI·물가 JSON 수동 반영               |
| 의견 모더레이션   | 관리자 계정 | —           | `/admin/notes`에서 hide/delete 처리          |
| 장애 대응         | mini5031    | —           | Firebase Console 알림 + GitHub Issues        |

관리자 권한은 이메일로 확정한 뒤 `set-admin-claim.mjs`로 부여한다. 현재 활성 관리자: `mini5031@nate.com`.

---

## 2. 분기별 리뷰 주기

각 분기 초(1·4·7·10월 첫 주)에 아래 체크리스트를 1일 내로 완료한다.

### 2-1. 데이터 갱신

- [ ] **TourAPI POI 재수집** — 부천 시내 + 인근 380건 목록 대비 장소명/주소 변경, 폐업 여부 확인
  - 수집 스크립트: `scripts/` (추후 추가 예정) 또는 관리자 UI에서 수동 재검증
- [ ] **부천시 개인서비스요금** — 부천시 공공데이터포털 최신 파일로 `src/data/live-prices-bucheon.json` 교체
- [ ] **강원특별자치도 CPI** — 분기 평균치로 `src/data/live-cpi-gangwon.json` 갱신
- [ ] **CPI 지수 스케일** — 통계청 소비자물가지수 월간 자료로 기준 년도 점검

### 2-2. 코스 재검토

- [ ] 31개 코스의 `heroImage` 링크 HTTP 200 여부 확인
- [ ] 코스 내 스톱별 `poi.thumbnail` 깨진 항목 제거 또는 교체
- [ ] 계절 코스(벚꽃/단풍/겨울 등)의 `published` 토글 상태 점검
- [ ] 4개 언어(`ko/en/ja/zh`) 문구 누락 여부 `locales/` 대비 검사

### 2-3. 기술 점검

- [ ] Lighthouse 모바일 성능·접근성·SEO 점수 로그
- [ ] Firebase Functions 로그에서 에러율 확인 (`firebase functions:log`)
- [ ] TourAPI 호출 성공률 확인 (로그에서 `source: 'mock'` 비율)
- [ ] 관리자 CMS 동작 스모크 테스트 (published 토글 1건, notes hide 1건)

---

## 3. 코스 추가·수정·삭제 절차

### 3-1. 신규 코스 추가

1. `src/data/courses/*.json` 또는 Firestore `courses/{id}`에 문서 생성
2. 필수 필드: `id`, `published`, `duration`, `styleTags[]`, `stops[]`, `i18n.{ko,en,ja,zh}`
3. `stops[].poi`에는 TourAPI contentId 또는 수동 POI 좌표 포함
4. `/admin/courses`에서 `published: false` 상태로 먼저 검수, QA 후 true로 전환
5. 공개 전: 메인/목록/상세 페이지에서 표시 확인 (4개 언어 전부)

### 3-2. 코스 수정

- 내용 변경: Firestore 또는 정적 JSON을 직접 수정 후 배포
- 임시 숨김: `/admin/courses`에서 `published` 토글을 false로 전환 (배포 없이 즉시 반영)
- 다국어 문구만 변경 시: `locales/{lang}/common.json` 편집 후 배포

### 3-3. 코스 삭제(보존 삭제)

원칙적으로 하드 삭제하지 않는다. `published: false` 전환만으로 비공개 처리한다. 삭제가 필요한 경우:

1. `/admin/courses`에서 토글 off
2. 2주간 유예 후 최종 삭제 여부 재검토
3. 삭제 확정 시 Firestore 문서 제거 + 관련 likes/notes 컬렉션 정리

---

## 4. 공공데이터 갱신 프로세스

### 4-1. TourAPI (정기)

- 매 분기: 오프닝 시간/주소 변경 일괄 재조회
- 매년: 연 1회 contentId 대량 재동기화 (명절·공연장 컨텐츠 재생성)

### 4-2. 부천시 데이터

- 공공데이터포털에서 분기별 CSV 다운로드 → `live-prices-bucheon.json` 스키마로 변환
- 스키마 변경 시 `src/pages/check-page.tsx` 렌더 로직 동반 수정

### 4-3. 강원 CPI / 신규 광역시도

- 6개월 내 로드맵: 광역 시·도 CPI 통합
- 데이터 유입 시: `src/data/cpi/*.json` 폴더로 분리 후 regionKey 기반 라우팅

---

## 5. 관리자 권한 부여

```bash
# Firebase 서비스 계정 키: /mnt/c/project/nwk/.secrets/sa.json (gitignored)
GOOGLE_APPLICATION_CREDENTIALS=./.secrets/sa.json \
  node scripts/set-admin-claim.mjs <uid|email>

# 해제
GOOGLE_APPLICATION_CREDENTIALS=./.secrets/sa.json \
  node scripts/set-admin-claim.mjs <uid|email> --revoke
```

권한 부여 후 해당 사용자는 재로그인해야 custom claim이 반영된다.

### 역할 확장(예정)

- `admin` — 전체 CMS 접근
- `editor` — 코스 편집만 허용 (향후 분기)
- `moderator` — notes 모더레이션만 허용 (향후 분기)

---

## 6. 배포 플로우

### 표준 배포

```bash
npm run lint
npm run build
firebase deploy --only hosting,firestore:rules
```

### Functions 변경 포함

```bash
firebase deploy --only hosting,functions,firestore:rules
```

### 핫픽스(코스 published 토글)

관리자 CMS만으로 커버된다. 배포 없이 즉시 반영.

---

## 7. 장애 대응 매뉴얼

| 증상                 | 1차 조치                                         | 2차 조치                                  |
| -------------------- | ------------------------------------------------ | ----------------------------------------- |
| TourAPI 호출 실패    | Functions 로그 확인 → `source: 'mock'` 폴백 동작 | 공공데이터포털 상태 페이지 확인           |
| 지도 타일 깨짐       | `/tiles` 함수 로그 + VWORLD_API_KEY 확인         | Kakao Maps SDK 도메인 화이트리스트 재확인 |
| 썸네일 404/CORS      | `/thumb` 함수 로그 확인                          | sharp 패키지 배포 여부 재확인             |
| Hosting 503/CORS     | 도메인 allowlist(`functions/src/index.ts`) 확인  | Firebase 서비스 상태 확인                 |
| 관리자 CMS 접근 불가 | custom claim 재부여 → 재로그인                   | Firebase Auth 콘솔에서 claim 검사         |

---

## 8. 보안 체크리스트(반기)

- [ ] Firestore 규칙 재검토 (`firestore.rules`)
- [ ] Storage 규칙 재검토 (`storage.rules`)
- [ ] 비공개 시크릿 로테이션 고려 (`TOUR_API_KEY`, `VWORLD_API_KEY`)
- [ ] 관리자 계정 목록 점검 (불필요한 권한 revoke)
- [ ] 서비스 계정 JSON(`.secrets/sa.json`) 접근자 한정
