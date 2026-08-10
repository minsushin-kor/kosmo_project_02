# 🐾 PetPulse AI Server

반려동물 건강 이상 위험도 예측 및 주간 웰니스 리포트 생성을 위한 **FastAPI AI 서버**입니다.

## 📁 프로젝트 구조

```
petpulse_ai/
├── app/
│   ├── main.py                          # FastAPI 서버 (5개 AI 엔드포인트)
│   └── data/
│       └── wellness_knowledge_base.json # 수의학 지식베이스 18개 항목 (RAG)
├── data/
│   └── pet_health_synthetic_dataset.csv # 학습용 합성 데이터 (3,000건)
├── models/
│   └── pet_risk_pipeline.pkl            # ML 파이프라인 + SHAP Explainer + 피처명
├── scripts/
│   ├── generate_data.py                 # 합성 데이터 생성 (노이즈 포함)
│   └── train_model.py                   # 4개 모델 비교 학습 + SHAP 저장
├── .env.example                         # 환경변수 예시 (복사 후 .env로 사용)
├── .gitignore
├── requirements.txt
└── README.md
```

## 🚀 빠른 시작

### 1. 환경 설정

```bash
# 가상환경 생성 및 활성화
python -m venv venv
venv\Scripts\activate  # Windows

# 패키지 설치
pip install -r requirements.txt
```

### 2. 환경변수 설정

```bash
# .env.example을 복사하여 .env 파일 생성
copy .env.example .env
# .env 파일을 열어 OPENAI_API_KEY 값 입력 (없으면 템플릿 Fallback 자동 사용)
```

### 3. 데이터 생성 및 모델 학습 (petpulse_ai/ 루트에서 실행)

```bash
python scripts/generate_data.py  # 합성 데이터 3,000건 생성
python scripts/train_model.py    # 4개 모델 비교 → 최고 모델 + SHAP 저장
```

### 4. FastAPI 서버 실행

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Swagger UI: http://127.0.0.1:8000/docs

---

## 📡 API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/ai/health` | 서버 상태 / SHAP 활성화 여부 확인 |
| `GET` | `/ai/model-info` | 모델명, 피처 수, SHAP 로드 상태 조회 |
| `POST` | `/ai/predict-health-risk` | ML + SHAP 기반 위험도 예측 |
| `POST` | `/ai/explain-prediction` | LLM + RAG 기반 자연어 설명 생성 |
| `POST` | `/ai/generate-weekly-report` | LLM 기반 주간 웰니스 리포트 생성 |

---

## 🧠 AI 파이프라인

```
[입력: 생체 데이터 + 문진]
       ↓
[1. ML 예측] XGBoost/LightGBM → 이상 확률(0~1) + 위험 등급
       ↓
[2. SHAP 분석] 이번 예측에 가장 기여한 피처 Top 2 → primaryRiskFactor
       ↓
[3. RAG 매칭] primaryRiskFactor → 수의학 지식베이스 체크포인트/조언
       ↓
[4. LLM 설명] OpenAI API → 보호자 친화적 자연어 설명 (없으면 템플릿 사용)
```

### ⚠️ 의료 가드레일
- LLM 프롬프트에 질병 진단·처방·약품 언급 금지 규칙 명시
- 수치 계산은 ML/Python 코드만 담당 (LLM에 계산 위임 금지)
- 항상 수의사 상담 권유 문구 포함

---

## 🔄 모델 재학습이 필요한 경우

`models/pet_risk_pipeline.pkl`이 SHAP Explainer 없이 저장된 경우:

```bash
python scripts/generate_data.py  # 데이터 재생성 (노이즈 반영)
python scripts/train_model.py    # SHAP 포함 재학습
```

`GET /ai/health` 응답의 `"shap_enabled": true`로 SHAP 활성화 확인 가능.
