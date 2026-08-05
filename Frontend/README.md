# PetPulse Frontend

반려동물의 생체정보와 건강 문진을 바탕으로 이상 징후를 살펴보는 웰니스 서비스의 프론트엔드입니다.

## 실행

```bash
npm install
npm run dev
```

## 검증

```bash
npm run lint
npm run build
```

## 현재 화면

- `/`: 서비스 랜딩
- `/dashboard`: 건강 대시보드 UI
- `/login`, `/signup`: 로그인·회원가입
- `/mypage`: 보호자 정보와 반려동물 관리
- `/pets`: 반려동물 목록과 선택
- `/pets/new`: 반려동물 등록
- `/pets/:petId/edit`: 반려동물 정보 수정
- `/pets/:petId/vitals`: 생체정보 모니터링
- `/pets/:petId/questionnaire`: 5단계 건강 문진
- `/pets/:petId/history`: 알림과 과거 예측 이력
- `/pets/:petId/reports`: 주간 리포트 목록
- `/pets/:petId/contents`: 건강관리 콘텐츠
- `/predictions/:predictionId`: AI 예측 결과
- `/reports/:reportId`: 주간 리포트 상세
- 그 외 주소: 404 안내

현재 화면의 값은 테마와 레이아웃 검증을 위한 임시 데이터입니다. 실제 API 계약이 확정되면 기능 폴더 안에서 타입·API·쿼리 훅을 순차적으로 추가합니다.

전체 진행 상태는 [`docs/frontend-progress.md`](docs/frontend-progress.md)에서 관리합니다.

## 디자인 기준

- 따뜻한 크림 배경과 올리브 계열의 신뢰감 있는 색상
- 반려동물 서비스의 친근함과 건강 데이터의 명료함을 함께 표현
- 위험도는 색상뿐 아니라 텍스트와 아이콘으로 구분
- 의료 진단으로 오해될 수 있는 표현을 피하고 건강관리 참고 정보임을 명시

공통 색상과 간격은 `src/styles/tokens.css`에서 관리합니다.

## 작업 범위

이 프로젝트에서 프론트엔드 담당자가 수정할 수 있는 범위는 `Frontend/` 폴더 내부로 제한합니다.
