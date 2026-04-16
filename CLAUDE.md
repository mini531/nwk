# NWK (No Worries Korea) - Claude Code Guidelines

## Project Overview
외국인 관광객을 위한 한국 여행 안전망 PWA 서비스.
TourAPI 관광지 검색 시 맞춤 주의사항·물가·교통·에티켓 자동 매칭.

## Tech Stack
- Frontend: React + TypeScript + Vite + Tailwind CSS
- State: Zustand
- i18n: react-i18next (사전 번역 JSON, 런타임 API 호출 금지)
- Map: 카카오맵 SDK (Cloud Functions 프록시 경유)
- Backend: Firebase Cloud Functions (Node.js + TypeScript)
- DB: Firestore
- Auth: Firebase Auth (Google 소셜 로그인만)
- Hosting: Firebase Hosting (PWA)
- CI/CD: GitHub Actions → Firebase 자동 배포

## 보안 필수 규칙 (MANDATORY)

### API 키 보호
- TourAPI, 카카오맵 API 키를 프론트엔드 코드에 절대 작성 금지
- Cloud Functions 환경변수(functions.config())에만 저장
- .env, .env.local은 .gitignore에 반드시 포함
- 브라우저 → Cloud Functions → 외부 API (직접 호출 금지)

### Firestore 보안
- 기본 deny-all, 필요한 경로만 명시적 허용
- 공개 데이터: 읽기만 허용 (prices, rules, mappings)
- 사용자 데이터: request.auth.uid == userId 검증 필수
- 클라이언트에서 관리자 쓰기 절대 금지

### 입력값 검증
- 검색어: 50자 제한, 특수문자 이스케이프
- 모든 사용자 입력은 Cloud Functions에서 재검증
- dangerouslySetInnerHTML 사용 절대 금지
- eval(), Function() 사용 금지

### CORS
- Cloud Functions에서 NWK 도메인만 허용
- 와일드카드(*) 사용 금지

### 인증
- Firebase Auth UID 기반 접근 제어
- 위치 정보: 브라우저에서만 처리, 서버 저장 금지

## 다국어 규칙
- 런타임에 번역 API 호출 절대 금지
- 모든 텍스트는 /locales/{lang}/*.json에 사전 번역
- 동적 import로 선택 언어 JSON만 로드
- 숫자·코드·좌표는 /data/에 언어 무관 공통 저장

## 코딩 컨벤션
- CSS class는 한 줄에 작성 (줄바꿈 금지)
- 컴포넌트: 함수형 + Hooks만 사용
- 파일명: kebab-case
- 타입: interface 우선 사용
- import 순서: React → 외부 라이브러리 → 내부 모듈 → 스타일

## 금지 사항
- AI API 호출 (GPT, Claude 등) → 운영비 발생
- 번역 API 호출 → 운영비 발생
- localStorage에 민감 정보 저장
- any 타입 남용

## 서비스 핵심 가치 (MANDATORY)

본 서비스의 차별점은 "현지인만 아는 실전 정보 제공"이다.
공식 관광 정보(Visit Korea)나 상업 서비스(Creatrip, Klook)가 알려주지 않는,
외국인 관광객에게 실제로 필요한 솔직한 정보가 핵심이다.

### 다루는 정보 (Do)
- 관광지별 정상가 기준 (바가지 방지)
- 음식·교통·입장료 평균가 비교
- 팁 문화 부재 등 한국 고유 에티켓 명시
- 관광객 대상 사기·호객 주의사항
- 한국인 기준의 "상식적인" 가격·행동 규범
- 국적·문화권별 자주 겪는 오해와 교정 정보

### 다루지 않는 정보 (Don't)
- 상업적 제휴·광고성 콘텐츠
- 검증되지 않은 리뷰·평점 집계
- 공식 관광 정보의 단순 복제
- 민감한 정치·종교·혐오 표현

## 운영비 정책 (MANDATORY)

본 서비스는 수익 창출이 없는 무료 서비스로,
월 유지비 최소화(목표: 0원 ~ 1만 원 수준)가 생존의 전제 조건이다.

### 비용 0원 유지 원칙
- 모든 컴퓨팅은 Firebase 무료 티어(Spark) 한도 내 설계
- Cloud Functions 호출 수 최소화: 클라이언트 캐시 적극 활용
- Firestore 읽기/쓰기 최소화: 정적 데이터는 Hosting CDN으로 제공
- 이미지·폰트는 외부 CDN(jsDelivr 등) 또는 Firebase Hosting 활용
- 도메인은 Firebase 기본 도메인 우선, 커스텀 도메인은 수익 확보 후 검토

### 비용 유발 기능 절대 금지
- 모든 외부 유료 API (AI/번역/푸시 알림 유료 플랜 등)
- 서버 사이드 이미지 처리 (리사이징·변환)
- 실시간 DB 리스너 남용 (Firestore onSnapshot 제한적 사용)
- 크론잡 빈번 실행 (일 1회 이내 권장)

### 데이터 구축 전략 (비용 없는 방식)
- 정상가 기준 DB: 공공데이터포털 + 수동 시드 + 사용자 제보
- 에티켓·주의사항: 빌드 타임에 정적 JSON 생성 (/data/ 경로)
- 번역: 사람이 검수한 정적 JSON (/locales/) 유지
- 사용자 제보는 읽기 전용 공개, 관리자 승인 후 반영

## 콘텐츠 품질 규칙

### 정상가·에티켓 데이터 원칙
- 모든 가격 정보는 출처·갱신일 필수 기재
- 정상가는 범위(min~max)로 제시, 단일 값 금지
- 에티켓은 "해도 됨/하면 안 됨/상황에 따라 다름" 3단계로 분류
- 지역·계절별 편차가 큰 항목은 별도 표기

### 금지 표현
- 특정 국적·문화권 비하
- 과장된 경고 ("무조건 사기" 등)
- 상호명을 직접 특정한 부정적 서술
- 주관적 추천·비추천 (객관 정보만 제시)
