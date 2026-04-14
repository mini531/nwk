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
