# PetPulse Frontend

반려동물의 생체정보와 건강 문진을 바탕으로 건강 위험 신호를 살펴보는 React 프론트엔드입니다.

## 기술 구성

- React 19 + TypeScript + Vite
- React Router
- Spring Boot REST API 연동
- FastAPI RAG 챗봇 SSE 스트리밍 연동
- Vitest + Testing Library

## 실행 준비

Node.js와 npm을 설치한 뒤 `Frontend` 폴더에서 의존성을 설치합니다.

```bash
npm install
```

환경변수 예시를 복사해 `.env`를 만듭니다.

```powershell
Copy-Item .env.example .env
```

기본 개발 환경은 다음 서버를 사용합니다.

- React: `http://localhost:5173`
- Spring Boot: `http://localhost:8080`
- FastAPI 챗봇: `http://localhost:8000`

```bash
npm run dev
```

Spring Boot가 실행되지 않거나 테스트 데이터가 없으면 일부 화면은 데모 데이터로 전환됩니다. 인증 API가 구현되기 전에는 `.env`의 `VITE_DEMO_USER_ID`가 반려동물 API의 사용자 ID로 사용됩니다.

## 환경변수

| 이름 | 기본 예시 | 용도 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | Spring Boot API 기본 경로 |
| `VITE_SPRING_API_TARGET` | `http://localhost:8080` | Vite 개발 프록시 대상 |
| `VITE_CHAT_API_URL` | `http://localhost:8000/ai/chat/stream` | FastAPI 챗봇 SSE 엔드포인트 |
| `VITE_DEMO_USER_ID` | `1` | 인증 API 구현 전 개발용 사용자 ID |

실제 API 키는 프론트엔드 환경변수에 저장하지 않습니다. OpenAI 키는 FastAPI 서버의 `.env`에서만 관리해야 합니다.

## 검증

```bash
npm run lint
npm test
npm run build
```

테스트를 수정하면서 반복 실행할 때는 `npm run test:watch`를 사용할 수 있습니다.

## 주요 경로

- `/`: 서비스 랜딩
- `/dashboard`: 건강 대시보드
- `/login`, `/signup`: 로그인·회원가입 데모 흐름
- `/mypage`: 보호자 정보와 반려동물 관리
- `/pets`: 반려동물 목록과 선택
- `/pets/new`: 반려동물 등록
- `/pets/:petId/edit`: 반려동물 정보 수정
- `/pets/:petId/vitals`: 생체정보 모니터링
- `/pets/:petId/questionnaire`: 5단계 건강 문진
- `/pets/:petId/history`: 알림과 과거 예측 이력
- `/pets/:petId/reports`: 주간 리포트 목록
- `/pets/:petId/diary`: 날짜별 상태와 건강 기록을 모은 건강 다이어리
- `/predictions/:predictionId`: AI 예측 결과
- `/reports/:reportId`: 주간 리포트 상세

## 현재 연동 범위

- 반려동물 등록·조회·수정·삭제
- 생체정보 최신값·전체 기록 조회와 CSV 내보내기
- 건강 문진 저장 및 예측 생성
- 예측 결과·알림·주간 리포트 조회
- RAG 챗봇 답변과 출처 SSE 스트리밍

실제 로그인/JWT, 프로필 이미지 업로드, 활동량 집계 및 알림 설정 API는 백엔드 구현 후 추가 연동이 필요합니다. 학습된 건강 위험도 모델이 준비된 뒤에는 문진부터 예측 결과까지 실제 데이터로 전체 흐름을 다시 검증해야 합니다.

전체 진행 상태는 [`docs/frontend-progress.md`](docs/frontend-progress.md)에서 관리합니다.
