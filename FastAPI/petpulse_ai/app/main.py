import os
import json
import joblib
import asyncio
import numpy as np
import pandas as pd
from typing import List, Optional, AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

# OpenAI API 라이브러리 (선택적 사용 및 에러 예외 처리)
try:
    import openai
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

# SHAP 라이브러리 (선택적 사용)
try:
    import shap
    HAS_SHAP = True
except ImportError:
    HAS_SHAP = False

# ChromaDB + Sentence-Transformers (진짜 RAG 기능, 선택적 사용)
try:
    import chromadb
    from sentence_transformers import SentenceTransformer
    HAS_RAG = True
except ImportError:
    HAS_RAG = False


# =====================================================================
# 1. 글로벌 상태 및 전역 변수 관리 (ML 모델 & 지식베이스 메모리 로드)
# =====================================================================
MODEL_PIPELINE = None
LABEL_MAPPING = {}
INVERSE_MAPPING = {}
WELLNESS_KNOWLEDGE_BASE = {}
SHAP_EXPLAINER = None
FEATURE_NAMES_OUT: List[str] = []

MODEL_PATH = "models/pet_risk_pipeline.pkl"
KNOWLEDGE_BASE_PATH = "app/data/wellness_knowledge_base.json"
RAG_DB_PATH = "app/data/chroma_db"

# RAG 전역 변수
RAG_COLLECTION = None
EMBEDDING_MODEL = None

# 환경변수에서 LLM 모델명 로드 (기본값: gpt-4o-mini)
LLM_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# SHAP 피처명 → 한국어 위험 요인 매핑 테이블
# ColumnTransformer 출력 피처명(prefix__원본명) 형식으로 매핑
FEATURE_FACTOR_MAP = {
    "num__temperature":         "체온 이상",
    "num__heart_rate":          "심박수 이상",
    "num__respiratory_rate":    "호흡 급증",
    "num__symptomDurationDays": "증상 장기화",
    "num__age":                 "고령",
    "num__weight":              "체중 이상",
    "ord__appetiteLevel":       "식욕 이상",
    "ord__activityLevel":       "활동량 감소",
    "ord__waterIntakeLevel":    "음수량 이상",
    "remainder__vomiting":      "구토",
    "remainder__diarrhea":      "설사",
    "remainder__skinRedness":   "피부 발적",
    "remainder__itching":       "피부 가려움",
    "remainder__hairLoss":      "탈모 징후",
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI 서버가 가동될 때 ML 모델과 지식베이스 JSON 파일을 메모리에 안전하게 로드합니다.
    SHAP Explainer와 피처명도 함께 로드합니다.
    """
    global MODEL_PIPELINE, LABEL_MAPPING, INVERSE_MAPPING, WELLNESS_KNOWLEDGE_BASE
    global SHAP_EXPLAINER, FEATURE_NAMES_OUT

    print("🚀 [FastAPI] AI 서버 가동 프로세스를 시작합니다...")
    print(f"ℹ️  [FastAPI] LLM 모델: {LLM_MODEL}")

    # (1) ML 파이프라인 모델 로드
    if os.path.exists(MODEL_PATH):
        try:
            saved_data = joblib.load(MODEL_PATH)
            MODEL_PIPELINE = saved_data["pipeline"]
            LABEL_MAPPING = saved_data["label_mapping"]
            INVERSE_MAPPING = saved_data["inverse_mapping"]
            # SHAP 및 피처명 로드 (train_model.py 재실행 후 생성됨)
            FEATURE_NAMES_OUT = saved_data.get("feature_names_out", [])
            SHAP_EXPLAINER = saved_data.get("shap_explainer", None)
            print(f"✅ [FastAPI] ML 파이프라인 로드 성공: {MODEL_PATH}")
            if SHAP_EXPLAINER is not None:
                print("✅ [FastAPI] SHAP Explainer 로드 성공 → 모델 근거 추출 활성화")
            else:
                print("⚠️ [FastAPI] SHAP Explainer 없음 → 규칙 기반 요인 추출 사용 (train_model.py 재실행 권장)")
            if FEATURE_NAMES_OUT:
                print(f"✅ [FastAPI] 피처명 {len(FEATURE_NAMES_OUT)}개 로드 성공")
        except Exception as e:
            print(f"⚠️ [FastAPI] ML 파이프라인 로드 중 오류 발생: {e}")
    else:
        print(f"⚠️ [FastAPI] 경고: {MODEL_PATH} 파일이 없습니다. (scripts/train_model.py 먼저 실행 권장)")

    # (2) 수의학 웰니스 지식베이스 JSON 로드
    if os.path.exists(KNOWLEDGE_BASE_PATH):
        try:
            with open(KNOWLEDGE_BASE_PATH, "r", encoding="utf-8") as f:
                WELLNESS_KNOWLEDGE_BASE = json.load(f)
            print(f"✅ [FastAPI] 수의학 지식베이스 로드 성공: {KNOWLEDGE_BASE_PATH} ({len(WELLNESS_KNOWLEDGE_BASE)}개 항목)")
        except Exception as e:
            print(f"⚠️ [FastAPI] 지식베이스 로드 중 오류 발생: {e}")
    else:
        print(f"⚠️ [FastAPI] 경고: {KNOWLEDGE_BASE_PATH} 파일이 없습니다.")

    # (3) ChromaDB RAG 인덱스 로드 (build_rag_index.py 실행 후 생성됨)
    global RAG_COLLECTION, EMBEDDING_MODEL
    if HAS_RAG and os.path.exists(RAG_DB_PATH):
        try:
            rag_client = chromadb.PersistentClient(path=RAG_DB_PATH)
            EMBEDDING_MODEL = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
            RAG_COLLECTION = rag_client.get_collection("vet_knowledge")
            print(f"✅ [FastAPI] RAG 인덱스 로드 성공: {RAG_COLLECTION.count()}개 수의학 문서 (벡터 검색 활성화)")
        except Exception as e:
            print(f"⚠️ [FastAPI] RAG 인덱스 로드 실패 (JSON 룩업 Fallback 사용): {e}")
    else:
        if not HAS_RAG:
            print("⚠️ [FastAPI] chromadb/sentence-transformers 미설치 → JSON 룩업 사용")
        else:
            print("⚠️ [FastAPI] RAG 인덱스 없음 → scripts/build_rag_index.py 실행 권장")

    yield  # 서버 실행 대기

    print("🛑 [FastAPI] AI 서버가 안전하게 종료되었습니다.")


# =====================================================================
# 2. FastAPI 앱 인스턴스 생성 및 CORS 설정
# =====================================================================
app = FastAPI(
    title="PetPulse AI Server",
    description="반려동물 생체정보 모니터링 및 건강 이상 위험도 예측 AI API",
    version="1.0.0",
    lifespan=lifespan
)

# 백엔드(Spring Boot) 및 프론트엔드(React) 교차 출처(CORS) 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실무 개발용 전체 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================================
# 3. Pydantic DTO (Data Transfer Object) 요청/응답 스키마 정의
# =====================================================================

# --- 1) /ai/predict-health-risk 요청/응답 스키마 ---
class HealthRiskPredictRequest(BaseModel):
    species: str = Field(..., example="DOG", description="반려동물 종 (DOG / CAT)")
    age: int = Field(..., ge=0, le=30, example=3, description="나이 (세)")
    weight: float = Field(..., ge=0.1, le=100.0, example=5.2, description="체중 (kg)")
    temperature: float = Field(..., ge=30.0, le=45.0, example=39.8, description="체온 (°C)")
    heartRate: int = Field(..., ge=30, le=300, example=145, description="심박수 (bpm)")
    respiratoryRate: int = Field(..., ge=5, le=100, example=32, description="호흡수 (회/분)")
    skinRedness: bool = Field(False, example=True, description="피부 붉어짐 여부")
    itching: bool = Field(False, example=True, description="가려움증 긁기 여부")
    hairLoss: bool = Field(False, example=False, description="탈모 징후 여부")
    vomiting: bool = Field(False, example=False, description="구토 여부")
    diarrhea: bool = Field(False, example=True, description="설사 여부")
    appetiteLevel: str = Field("NORMAL", example="DECREASED", description="식욕 상태 (NONE, DECREASED, NORMAL, INCREASED)")
    waterIntakeLevel: str = Field("NORMAL", example="NORMAL", description="음수량 상태 (DECREASED, NORMAL, INCREASED)")
    activityLevel: str = Field("NORMAL", example="LOW", description="활동량 상태 (LOW, NORMAL, HIGH)")
    symptomDurationDays: int = Field(0, ge=0, example=3, description="증상 지속 일수 (일)")


class HealthRiskPredictResponse(BaseModel):
    abnormalProbability: float = Field(..., example=0.68, description="이상 확률 (0.00 ~ 1.00)")
    riskGrade: str = Field(..., example="CAUTION", description="위험 등급 (NORMAL, WATCH, CAUTION, DANGER)")
    primaryRiskFactor: str = Field(..., example="체온 이상 및 구토", description="대표 위험 요인 (SHAP 기반 / 규칙 기반 fallback)")


# --- 2) /ai/explain-prediction 요청/응답 스키마 ---
class ExplainPredictionRequest(BaseModel):
    species: str = Field("DOG", example="DOG")
    age: int = Field(3, example=7)
    riskGrade: str = Field("CAUTION", example="CAUTION")
    abnormalProbability: float = Field(0.68, example=0.68)
    primaryRiskFactor: str = Field("체온 이상 및 구토", example="체온 이상 및 구토")
    symptomDurationDays: int = Field(3, example=3)
    additionalSymptoms: Optional[str] = Field(None, example="날씨가 더워진 후 사료를 잘 안 먹어요.")


class ExplainPredictionResponse(BaseModel):
    explanation: str = Field(..., description="LLM이 가공한 다정한 원인 설명 문장")
    checkpoints: List[str] = Field(..., description="수의학 지식베이스 체크포인트 목록")
    advice: str = Field(..., description="보호자 케어 권고사항")


# --- 3) /ai/generate-weekly-report 요청/응답 스키마 ---
class WeeklyReportRequest(BaseModel):
    petName: str = Field("초코", example="초코")
    species: str = Field("DOG", example="DOG")
    age: int = Field(3, example=5)
    avgTemperature: float = Field(38.6, example=38.8)
    avgHeartRate: float = Field(105.0, example=115.0)
    avgRespiratoryRate: float = Field(22.0, example=28.0)
    cautionAlertCount: int = Field(0, example=2)
    dangerAlertCount: int = Field(0, example=0)
    questionnaireCount: int = Field(1, example=3)
    mainSymptomsSummary: Optional[str] = Field(None, example="주초 미열 및 경미한 식욕 저하 관찰")


class WeeklyReportResponse(BaseModel):
    reportTitle: str = Field(..., description="주간 리포트 제목")
    oneLineSummary: str = Field(..., description="한 줄 요약 문구")
    reportContent: str = Field(..., description="주간 종합 건강 분석 텍스트")
    recommendedCare: List[str] = Field(..., description="이번 주 추천 케어 포인트")


# =====================================================================
# 4. 헬퍼 함수
# =====================================================================

def get_shap_risk_factors(df_input: pd.DataFrame, predicted_class_idx: int) -> Optional[str]:
    """
    SHAP TreeExplainer를 사용하여 이번 예측에 가장 크게 기여한 피처 Top 2를 추출합니다.
    ML 모델의 실제 판단 근거를 반영하여 규칙 기반 방식보다 정확한 위험 요인을 제공합니다.
    SHAP 사용 불가 시 None을 반환하여 규칙 기반 Fallback을 유도합니다.
    """
    if SHAP_EXPLAINER is None or not FEATURE_NAMES_OUT or not HAS_SHAP:
        return None

    try:
        # 1. 입력 데이터를 전처리기로 변환 (ML 추론과 동일한 변환 적용)
        X_transformed = MODEL_PIPELINE.named_steps["preprocessor"].transform(df_input)

        # 2. SHAP 값 계산
        shap_values = SHAP_EXPLAINER.shap_values(X_transformed)

        # 3. 멀티클래스 처리: 예측된 클래스의 SHAP 벡터만 선택
        if isinstance(shap_values, list):
            # List 형태: [class_0 array, class_1 array, ...] - XGBoost/LightGBM 일반 형태
            idx = min(predicted_class_idx, len(shap_values) - 1)
            sv = np.array(shap_values[idx][0])
        else:
            # 3D 배열 형태: (n_samples, n_features, n_classes)
            sv = np.array(shap_values[0])
            if sv.ndim == 2:
                sv = sv[:, predicted_class_idx]

        # 4. 양의 SHAP 값(위험 증가에 기여한 피처) 기준 상위 피처 추출
        positive_mask = sv > 0
        if not positive_mask.any():
            return "이상 없음(정상)"

        positive_indices = np.where(positive_mask)[0]
        top_indices = positive_indices[np.argsort(sv[positive_indices])[::-1]][:3]

        # 5. 피처명 → 한국어 위험 요인 변환 (중복 제거, 종 정보 제외)
        factors = []
        seen = set()
        for feat_idx in top_indices:
            if feat_idx >= len(FEATURE_NAMES_OUT):
                continue
            feature_name = FEATURE_NAMES_OUT[feat_idx]
            factor = FEATURE_FACTOR_MAP.get(feature_name, "")
            if factor and factor not in seen:
                factors.append(factor)
                seen.add(factor)

        if not factors:
            return None  # 매핑 실패 시 규칙 기반 fallback 유도

        return " 및 ".join(factors[:2])

    except Exception as e:
        print(f"⚠️ SHAP 분석 오류 (규칙 기반 Fallback 사용): {e}")
        return None


def get_rule_based_risk_factors(
        req: HealthRiskPredictRequest,
        risk_grade: str) -> str:

    if risk_grade == "NORMAL":
        return "이상 없음(정상)"

    factors = []

    if req.temperature >= 40.0:
        factors.append("고열")
    elif req.temperature >= 39.3:
        factors.append("체온 상승")

    if req.heartRate >= 150:
        factors.append("심박수 이상")

    if req.respiratoryRate >= 40:
        factors.append("호흡 급증")

    if req.vomiting and req.diarrhea:
        factors.append("소화기 이상(구토/설사)")
    elif req.vomiting:
        factors.append("구토")
    elif req.diarrhea:
        factors.append("설사")

    if req.skinRedness or req.itching or req.hairLoss:
        factors.append("피부 징후")

    if req.appetiteLevel in ["NONE", "DECREASED"]:
        factors.append("식욕 저하")

    if req.activityLevel == "LOW":
        factors.append("활동량 감소")

    return " 및 ".join(factors[:2]) if factors else "이상 없음(정상)"


def search_knowledge_base(primary_factor: str) -> dict:
    """
    primaryRiskFactor 문장을 분석하여 지식베이스 JSON에서 알맞은 수의학 가이드라인을 매칭합니다.
    복합 키인 경우 개별 증상 키를 찾아 합쳐주는 Fallback 기능을 포함합니다.
    """
    if not WELLNESS_KNOWLEDGE_BASE:
        return {
            "checkpoints": ["현재 상태 및 행동 변화를 주의 깊게 모니터링해 주세요."],
            "advice": "아이가 수분을 충분히 섭취할 수 있도록 돕고 편안한 휴식을 취하게 해주세요."
        }

    # 1) 정확히 일치하는 키가 존재할 때
    if primary_factor in WELLNESS_KNOWLEDGE_BASE:
        return WELLNESS_KNOWLEDGE_BASE[primary_factor]

    # 2) 복합 키 매칭 로직 (핵심 키워드 포함 관계 확인)
    combined_checkpoints = []
    combined_advices = []

    for key, data in WELLNESS_KNOWLEDGE_BASE.items():
        if key == "이상 없음(정상)":
            continue
        # 키의 주요 단어 중 하나라도 factor에 포함되면 매칭
        keywords = [w for w in key.replace("(", "").replace(")", "").replace("/", " ").split() if len(w) > 1]
        if any(kw in primary_factor for kw in keywords):
            combined_checkpoints.extend(data.get("checkpoints", []))
            advice = data.get("advice", "")
            if advice:
                combined_advices.append(advice)

    if combined_checkpoints:
        # 순서 유지 중복 제거
        seen = set()
        unique_checkpoints = [c for c in combined_checkpoints if not (c in seen or seen.add(c))]
        return {
            "checkpoints": unique_checkpoints[:4],  # 최대 4개
            "advice": " ".join(combined_advices[:2])
        }

    # 3) 일치하는 것이 없을 시 기본 정상 가이드
    return WELLNESS_KNOWLEDGE_BASE.get("이상 없음(정상)", {
        "checkpoints": ["체온 및 수분 섭취 상태가 양호한지 확인해 주세요."],
        "advice": "정기적인 산책과 깨끗한 음수 환경을 유지해 주세요."
    })



def search_rag(query: str, n_results: int = 3) -> Optional[dict]:
    """
    ChromaDB 벡터 유사도 검색으로 가장 관련 있는 수의학 문서를 반환합니다.
    primaryRiskFactor + 보호자 소견을 자연어 쿼리로 넣으면 의미적으로 유사한 문서를 검색합니다.
    ChromaDB 미로드 시 None을 반환하여 JSON 룩업 Fallback을 유도합니다.
    """
    global RAG_COLLECTION, EMBEDDING_MODEL
    if RAG_COLLECTION is None or EMBEDDING_MODEL is None:
        return None
    try:
        query_embedding = EMBEDDING_MODEL.encode([query]).tolist()
        results = RAG_COLLECTION.query(
            query_embeddings=query_embedding,
            n_results=n_results,
            include=["documents", "metadatas", "distances"]
        )
        if not results or not results["documents"] or not results["documents"][0]:
            return None
        return {
            "documents": results["documents"][0],
            "metadatas": results["metadatas"][0],
            "distances":  results["distances"][0],
        }
    except Exception as e:
        print(f"⚠️ RAG 검색 오류 (JSON 룩업 Fallback): {e}")
        return None


# =====================================================================
# 5. API 엔드포인트 구현 (5개 명세 규격 100% 준수)
# =====================================================================

# ---------------------------------------------------------------------
# [Endpoint 1] GET /ai/health : 서버 상태 확인
# ---------------------------------------------------------------------
@app.get("/ai/health", summary="FastAPI 상태 확인", tags=["System"])
def health_check():
    return {
        "status": "UP",
        "message": "PetPulse FastAPI AI Server is running normally.",
        "modelLoaded": MODEL_PIPELINE is not None,
        "knowledgeBaseLoaded": len(WELLNESS_KNOWLEDGE_BASE) > 0,
        "shapEnabled": SHAP_EXPLAINER is not None,
        "llmModel": LLM_MODEL,
    }


# ---------------------------------------------------------------------
# [Endpoint 2] GET /ai/model-info : 모델 정보 및 버전 조회
# ---------------------------------------------------------------------
@app.get("/ai/model-info", summary="모델 버전 및 메타데이터 조회", tags=["AI Model"])
def get_model_info():
    if MODEL_PIPELINE is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML 모델이 준비되지 않았습니다."
        )

    classifier_name = MODEL_PIPELINE.named_steps["classifier"].__class__.__name__

    return {
        "modelName": classifier_name,
        "version": "1.0.0",
        "shapExplainerLoaded": SHAP_EXPLAINER is not None,
        "featureCount": len(FEATURE_NAMES_OUT),
        "supportedRiskGrades": [
            "NORMAL",
            "WATCH",
            "CAUTION",
            "DANGER"
        ],
        "inputFeatures": [
            "species",
            "age",
            "weight",
            "temperature",
            "heartRate",
            "respiratoryRate",
            "skinRedness",
            "itching",
            "hairLoss",
            "vomiting",
            "diarrhea",
            "appetiteLevel",
            "waterIntakeLevel",
            "activityLevel",
            "symptomDurationDays"
        ]
    }

# ---------------------------------------------------------------------
# [Endpoint 3] POST /ai/predict-health-risk : ML 위험도 예측 (SHAP 기반)
# ---------------------------------------------------------------------
@app.post(
    "/ai/predict-health-risk",
    response_model=HealthRiskPredictResponse,
    summary="건강 이상 위험도 및 주요 요인 예측 (ML + SHAP)",
    tags=["AI Model"]
)
def predict_health_risk(req: HealthRiskPredictRequest):
    if MODEL_PIPELINE is None:
        # 모델이 로드되지 않은 예외 상황 시 안전한 스코어링 규칙 계산 Fallback
        score = 0.0
        if req.temperature >= 40.0: score += 0.4
        elif req.temperature >= 39.3: score += 0.2
        if req.vomiting or req.diarrhea: score += 0.2
        prob = round(min(score, 1.0), 2)
        grade = "NORMAL" if prob < 0.3 else "WATCH" if prob < 0.5 else "CAUTION" if prob < 0.75 else "DANGER"
        factor = get_rule_based_risk_factors(req, grade)
        return HealthRiskPredictResponse(abnormalProbability=prob, riskGrade=grade, primaryRiskFactor=factor)

    try:
        # 1. Pydantic 요청 데이터를 DataFrame 1줄로 변환
        input_data = {
            "species": [req.species],
            "age": [req.age],
            "weight": [req.weight],
            "temperature": [req.temperature],
            "heart_rate": [req.heartRate],
            "respiratory_rate": [req.respiratoryRate],
            "skinRedness": [int(req.skinRedness)],
            "itching": [int(req.itching)],
            "hairLoss": [int(req.hairLoss)],
            "vomiting": [int(req.vomiting)],
            "diarrhea": [int(req.diarrhea)],
            "appetiteLevel": [req.appetiteLevel],
            "waterIntakeLevel": [req.waterIntakeLevel],
            "activityLevel": [req.activityLevel],
            "symptomDurationDays": [req.symptomDurationDays],
        }
        df_input = pd.DataFrame(input_data)

        # 2. ML 모델 추론 (클래스별 확률 및 예측 클래스 인덱스)
        probabilities = MODEL_PIPELINE.predict_proba(df_input)[0]
        predicted_class_idx = int(MODEL_PIPELINE.predict(df_input)[0])

        # NORMAL(0)을 제외한 나머지 이상 등급(WATCH, CAUTION, DANGER) 확률의 합 산출
        abnormal_prob = round(float(sum(probabilities[1:])), 2)

        # 3. 확률 구간에 따른 기획서 규격 riskGrade 확정
        if abnormal_prob < 0.30:
            risk_grade = "NORMAL"
        elif abnormal_prob < 0.50:
            risk_grade = "WATCH"
        elif abnormal_prob < 0.75:
            risk_grade = "CAUTION"
        else:
            risk_grade = "DANGER"

        # 4. SHAP 기반 primaryRiskFactor 추출 (ML 모델의 실제 판단 근거 반영)
        primary_factor = get_shap_risk_factors(df_input, predicted_class_idx)

        # SHAP 사용 불가 시 규칙 기반 Fallback
        if primary_factor is None:
            primary_factor = get_rule_based_risk_factors(req, risk_grade)

        return HealthRiskPredictResponse(
            abnormalProbability=abnormal_prob,
            riskGrade=risk_grade,
            primaryRiskFactor=primary_factor
        )

    except Exception as e:
        print(f"❌ 추론 도중 에러 발생: {e}")
        # 에러 발생 시에도 500 에러 대신 안전한 기본값 반환
        return HealthRiskPredictResponse(
            abnormalProbability=0.0,
            riskGrade="NORMAL",
            primaryRiskFactor="이상 없음(정상)"
        )


# ---------------------------------------------------------------------
# [Endpoint 4] POST /ai/explain-prediction : 원인 및 웰니스 가이드 생성 (LLM)
# ---------------------------------------------------------------------
@app.post(
    "/ai/explain-prediction",
    response_model=ExplainPredictionResponse,
    summary="예측 결과 자연어 설명 생성 (LLM/RAG)",
    tags=["Generative AI"]
)
def explain_prediction(req: ExplainPredictionRequest):
    # ----------------------------------------------------------------
    # 1. RAG 벡터 검색 (primaryRiskFactor + 보호자 소견을 자연어 쿼리로)
    # ----------------------------------------------------------------
    rag_query = req.primaryRiskFactor
    if req.additionalSymptoms:
        rag_query += f" {req.additionalSymptoms}"

    rag_results = search_rag(rag_query)  # ChromaDB 벡터 유사도 검색

    # ----------------------------------------------------------------
    # 2. JSON 룩업 → structured checkpoints 및 base_advice 추출
    #    (RAG 유무와 관계없이 항상 실행, 구조화된 응답 필드 보장)
    # ----------------------------------------------------------------
    knowledge = search_knowledge_base(req.primaryRiskFactor)
    checkpoints = knowledge.get("checkpoints", [])
    base_advice = knowledge.get("advice", "아이의 컨디션을 주의 깊게 살펴주세요.")

    # ----------------------------------------------------------------
    # 3. OpenAI API 연동 시도 (RAG 컨텍스트를 프롬프트에 주입)
    # ----------------------------------------------------------------
    api_key = os.getenv("OPENAI_API_KEY")
    if HAS_OPENAI and api_key:
        try:
            client = openai.OpenAI(api_key=api_key)

            # RAG 검색 결과가 있으면 수의학 문서를 컨텍스트로 추가
            if rag_results and rag_results["documents"]:
                rag_context = "\n\n".join(
                    f"[수의학 참고문서 {i+1}] {doc}"
                    for i, doc in enumerate(rag_results["documents"])
                )
                rag_source = "RAG 벡터 검색"
            else:
                # RAG 없을 때는 JSON 체크포인트를 컨텍스트로 대체
                rag_context = "\n".join(f"- {c}" for c in checkpoints)
                rag_source = "지식베이스 룩업"

            prompt = f"""너는 다정하고 전문적인 반려동물 웰니스 케어 매니저야.
아래 수의학 참고 정보({rag_source})를 바탕으로, 보호자에게 증상의 일상적·환경적 원인 2~3가지를 친절하게 설명해줘.

[아이 정보] 종: {req.species}, 나이: {req.age}세, 증상 지속일: {req.symptomDurationDays}일
[ML 위험 분석] 위험 등급: {req.riskGrade}, 주요 위험 요인: {req.primaryRiskFactor}
[보호자 추가 소견]: {req.additionalSymptoms or '없음'}

[수의학 참고 정보]
{rag_context}

답변 작성 규칙:
1. 특정 질병명(췌장염, 파보 등)이나 약품 처방을 절대 언급하지 말 것.
2. 보호자가 가정에서 점검할 수 있는 환경적·생리적 원인 위주로 3문장 이내로 다정하게 작성할 것.
3. 참고 문서 번호([수의학 참고문서 N])를 직접 언급하지 말 것."""

            response = client.chat.completions.create(
                model=LLM_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=350,
                temperature=0.7
            )
            llm_text = response.choices[0].message.content.strip()
            return ExplainPredictionResponse(
                explanation=llm_text,
                checkpoints=checkpoints,
                advice=base_advice
            )
        except Exception as e:
            print(f"⚠️ OpenAI API 호출 실패 (스마트 템플릿 사용): {e}")

    # ----------------------------------------------------------------
    # 4. LLM 미연동 시 스마트 템플릿 Fallback
    #    RAG 검색 결과가 있으면 첫 번째 문서를 설명에 활용
    # ----------------------------------------------------------------
    symptom_context = f" ({req.additionalSymptoms})" if req.additionalSymptoms else ""

    if rag_results and rag_results["documents"]:
        # RAG 검색된 첫 번째 문서 앞부분을 설명에 삽입
        rag_hint = rag_results["documents"][0][:150].rstrip()
        explanation_text = (
            f"{req.age}살 {req.species} 아이에게서 [{req.primaryRiskFactor}] 징후가 감지되어 주의가 필요합니다{symptom_context}. "
            f"{rag_hint}... "
            f"가정 내 환경과 수분 섭취 상태를 우선 점검해 주시기 바랍니다."
        )
    else:
        explanation_text = (
            f"{req.age}살 {req.species} 아이에게서 [{req.primaryRiskFactor}] 징후가 감지되어 주의 깊은 관찰이 필요한 상태입니다{symptom_context}. "
            f"갑작스러운 환경 변화, 사료나 간식 교체, 실내 적정 온도 이탈, 또는 일시적인 스트레스나 기력 저하가 원인일 수 있습니다. "
            f"질병을 단정하기보다는 가정 내 환경과 수분 섭취 상태를 우선 점검해 주시기 바랍니다."
        )

    return ExplainPredictionResponse(
        explanation=explanation_text,
        checkpoints=checkpoints,
        advice=base_advice
    )


# ---------------------------------------------------------------------
# [Endpoint 5] POST /ai/generate-weekly-report : 주간 웰니스 리포트 생성 (LLM)
# ---------------------------------------------------------------------
@app.post(
    "/ai/generate-weekly-report",
    response_model=WeeklyReportResponse,
    summary="주간 종합 웰니스 리포트 생성 (LLM)",
    tags=["Generative AI"]
)
def generate_weekly_report(req: WeeklyReportRequest):
    # 1. 리포트 기본 제목 및 요약 생성
    title = f"{req.petName}의 주간 웰니스 종합 케어 리포트 🐾"

    if req.dangerAlertCount > 0:
        one_line = f"지난 한 주간 긴급 주의가 필요한 이상 징후가 {req.dangerAlertCount}회 감지되었습니다."
    elif req.cautionAlertCount > 0:
        one_line = f"지난 한 주간 지속적인 컨디션 관찰이 필요한 상태였습니다."
    else:
        one_line = f"지난 한 주간 전반적으로 안정적인 웰니스 상태를 유지했습니다."

    # 2. OpenAI API 연동 시도 (API KEY가 있으면 고급 LLM 리포트 생성)
    api_key = os.getenv("OPENAI_API_KEY")
    if HAS_OPENAI and api_key:
        try:
            client = openai.OpenAI(api_key=api_key)
            prompt = f"""
너는 반려동물 건강 리포트 전문 에디터야.
아래 주간 데이터 통계를 바탕으로 보호자에게 보여줄 종합 주간 웰니스 리포트 문장을 다정하게 작성해줘.

- 이름/종/나이: {req.petName} ({req.species}, {req.age}세)
- 주간 평균 생체 지표: 체온 {req.avgTemperature}°C, 심박수 {req.avgHeartRate}bpm, 호흡수 {req.avgRespiratoryRate}회/분
- 알림 내역: 주의 알림 {req.cautionAlertCount}회, 위험 알림 {req.dangerAlertCount}회
- 건강 상태 종합 소견: {req.mainSymptomsSummary or '특이사항 없음'}

작성 지침:
1. 다정하고 체계적인 어조로 4문장 내외로 종합 분석 문장을 작성할 것.
2. 진정성이 느껴지는 웰니스 관리 조언을 담을 것.
"""
            response = client.chat.completions.create(
                model=LLM_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=400,
                temperature=0.7
            )
            report_content = response.choices[0].message.content.strip()

            return WeeklyReportResponse(
                reportTitle=title,
                oneLineSummary=one_line,
                reportContent=report_content,
                recommendedCare=[
                    f"체온 및 음수량 일일 모니터링 (주간 평균 체온: {req.avgTemperature}°C)",
                    "실내 적정 온도(20~23°C) 및 습도(40~60%) 유지를 통한 스트레스 완화",
                    "주기적인 산책 및 미온수 공급을 통한 활력 유지"
                ]
            )
        except Exception as e:
            print(f"⚠️ OpenAI API 주간 리포트 생성 실패 (스마트 템플릿 사용): {e}")

    # 3. LLM 미연동 시 사용하는 스마트 템플릿 (Fallback)
    content_text = (
        f"한 주 동안 {req.petName}의 평균 체온은 {req.avgTemperature}°C, 심박수는 {req.avgHeartRate}bpm, "
        f"호흡수는 {req.avgRespiratoryRate}회/분으로 기록되었습니다. "
        f"주간 총 {req.questionnaireCount}회의 건강 문진이 기록되었으며, {one_line} "
        f"앞으로도 정기적인 생체 수치 측정과 깨끗한 음수 환경을 지속적으로 제공해 주시기 바랍니다."
    )

    return WeeklyReportResponse(
        reportTitle=title,
        oneLineSummary=one_line,
        reportContent=content_text,
        recommendedCare=[
            f"주간 평균 체온({req.avgTemperature}°C) 유지 및 미온수 소량씩 공급",
            "환절기 실내 온도 및 습도 환경 점검",
            "이상 행동(식욕/활동량 감소) 지속 여부 관찰"
        ]
    )



# =====================================================================
# [Endpoint 6] POST /ai/chat/stream : RAG 기반 SSE 스트리밍 챗봇
# =====================================================================

class ChatStreamRequest(BaseModel):
    message: str = Field(..., example="강아지가 헐담이는 이유가 뛭니요?", description="보호자가 입력한 자유 질문")
    species: Optional[str] = Field(None, example="DOG", description="반려동물 종 (선택, DOG/CAT)")


async def _stream_chat_response(
    message: str,
    species: Optional[str]
) -> AsyncGenerator[str, None]:
    """
    SSE 이벤트 제네레이터.
    - RAG 벡터 검색으로 수의학 문서 3개 추출
    - OpenAI stream=True 로 성 단위 SSE 전송
    - 완료 시 [SOURCES] 이벤트로 출처 목록 전송
    - OpenAI 미연동 시 RAG 문서 요약 템플릿 Fallback
    """
    # 1. RAG 빡터 검색
    rag_query = message
    if species:
        rag_query = f"[{species}] {message}"

    rag_results = search_rag(rag_query, n_results=3)

    sources = []
    rag_context = ""

    if rag_results and rag_results["documents"]:
        for doc, meta in zip(rag_results["documents"], rag_results["metadatas"]):
            sources.append({
                "title": meta.get("title", ""),
                "category": meta.get("category", ""),
            })
        rag_context = "\n\n".join(
            f"[수의학 참고 {i+1}] {doc}"
            for i, doc in enumerate(rag_results["documents"])
        )

    # 2. OpenAI 스트리밍 시도
    api_key = os.getenv("OPENAI_API_KEY")
    if HAS_OPENAI and api_key and rag_context:
        try:
            client = openai.OpenAI(api_key=api_key)
            species_ctx = f" ({species}를 키우고 있습니다." if species else ""
            prompt = f"""너는 다정하고 전문적인 반려동물 웰니스 코치야.{species_ctx}
아래 수의학 참고 자료를 바탕으로 보호자의 질문에 친절하고 정확하게 답해줘.

[수의학 참고 자료]
{rag_context}

[보호자 질문]
{message}

답변 규칙:
1. 특정 질병명이나 약품 처방을 절대 언급하지 말 것.
2. 수의학 참고 자료 번호([수의학 참고 N])를 직접 언급하지 말 것.
3. 3문단 이내로 친근하게 작성할 것.
4. 증상이 24시간 이상 지속되는 경우 수의사 베지트 권유 문구를 자연스럽게 포함할 것."""

            stream = client.chat.completions.create(
                model=LLM_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=400,
                temperature=0.7,
                stream=True,
            )

            # 성 단위로 SSE data 전송
            for chunk in stream:
                delta = chunk.choices[0].delta
                if delta and delta.content:
                    token = delta.content
                    yield f"data: {json.dumps({'type': 'token', 'content': token}, ensure_ascii=False)}\n\n"
                    await asyncio.sleep(0)   # 이벤트 루프 양보

        except Exception as e:
            print(f"⚠️ SSE 스트리밍 오류 (Fallback 사용): {e}")
            # 스트리밍 실패 시 Fallback 템플릿
            fallback = _build_rag_fallback(message, rag_results)
            yield f"data: {json.dumps({'type': 'token', 'content': fallback}, ensure_ascii=False)}\n\n"

    else:
        # OpenAI 미연동 Fallback
        fallback = _build_rag_fallback(message, rag_results)
        yield f"data: {json.dumps({'type': 'token', 'content': fallback}, ensure_ascii=False)}\n\n"

    # 3. 완료 신호 + 출처 리스트 전송
    yield f"data: {json.dumps({'type': 'done', 'sources': sources}, ensure_ascii=False)}\n\n"


def _build_rag_fallback(message: str, rag_results: Optional[dict]) -> str:
    """
    OpenAI 미연동 또는 스트리밍 실패 시 RAG 문서 요약으로 답변을 대체합니다.
    """
    if rag_results and rag_results["documents"]:
        top_doc = rag_results["documents"][0][:300].rstrip()
        return (
            f"질문하신 내용과 관련하여 \n\n"
            f"{top_doc}...\n\n"
            f"증상이 지속되거나 심해지면 가까운 동물병원에 방문하시는 것을 담당 수의사와 상담해주세요."
        )
    return (
        f"'{message}'에 대한 수의학 정보를 찾지 못했습니다. "
        f"자세한 증상은 수의사 상담을 권장드립니다."
    )


@app.post(
    "/ai/chat/stream",
    summary="RAG 기반 SSE 스트리밍 콘질문답 챗봇",
    tags=["Chatbot"],
    response_class=StreamingResponse,
)
async def chat_stream(req: ChatStreamRequest):
    """
    React가 보호자의 자유 질문을 보내면, RAG 기반 답변을 SSE로 실시간 스트리밍 합니다.

    SSE 이벤트 형식:
      data: {"type": "token",  "content": "성 단위 텍스트"}\n\n   # 답변 트리거 실시간 전송
      data: {"type": "done",   "sources": [{...}]}\n\n   # 완료 + 출처 목록

    React 사용 예시:
      const es = new EventSource('/ai/chat/stream');
      또는 fetch + ReadableStream으로 SSE 파싱
    """
    return StreamingResponse(
        _stream_chat_response(req.message, req.species),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # nginx 버퍼링 비활성화
        },
    )


# =====================================================================
# 6. 로컈 직접 실행 가이드 (uvicorn 가동)
# =====================================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)