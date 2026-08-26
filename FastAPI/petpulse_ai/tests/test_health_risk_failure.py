from fastapi.testclient import TestClient

from app import main

client = TestClient(main.app)


def test_default_cors_origins_are_local_and_never_wildcard():
    assert main.CORS_ALLOWED_ORIGINS == [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    assert "*" not in main.CORS_ALLOWED_ORIGINS


def test_cors_origin_parser_rejects_wildcard():
    try:
        main.parse_cors_allowed_origins("*")
    except ValueError as error:
        assert "wildcard" in str(error)
    else:
        raise AssertionError("wildcard CORS origin must be rejected")


def request():
    return main.HealthRiskPredictRequest(
        species="DOG",
        age=3,
        weight=5.5,
        temperature=40.1,
        heartRate=100,
        respiratoryRate=24,
        skinRedness=False,
        itching=False,
        hairLoss=False,
        vomiting=False,
        diarrhea=False,
        appetiteLevel="NORMAL",
        waterIntakeLevel="NORMAL",
        activityLevel="NORMAL",
        symptomDurationDays=0,
    )


def test_model_not_loaded_uses_explicit_rule_based_fallback(monkeypatch):
    monkeypatch.setattr(main, "MODEL_PIPELINE", None)

    response = main.predict_health_risk(request())

    assert response.abnormalProbability == 0.4
    assert response.riskGrade == "WATCH"


def test_normal_model_result_never_exposes_shap_risk_factor(monkeypatch):
    class NormalModel:
        def predict_proba(self, _data):
            return [[1.0, 0.0, 0.0, 0.0]]

        def predict(self, _data):
            return [0]

    def unexpected_shap_call(*_args):
        raise AssertionError("NORMAL 결과에서는 SHAP 위험 요인을 계산하면 안 됩니다.")

    normal_request = request().model_copy(update={"temperature": 38.5})
    monkeypatch.setattr(main, "MODEL_PIPELINE", NormalModel())
    monkeypatch.setattr(main, "get_shap_risk_factors", unexpected_shap_call)

    response = main.predict_health_risk(normal_request)

    assert response.abnormalProbability == 0.0
    assert response.riskGrade == "NORMAL"
    assert response.primaryRiskFactor == "이상 없음(정상)"


def test_inference_exception_returns_generic_service_error(monkeypatch):
    class FailingModel:
        def predict_proba(self, _data):
            raise RuntimeError("internal model details")

    monkeypatch.setattr(main, "MODEL_PIPELINE", FailingModel())

    response = client.post("/ai/predict-health-risk", json=request().model_dump())

    assert response.status_code == 503
    assert response.json() == {
        "detail": "건강 위험도 예측 서비스를 일시적으로 사용할 수 없습니다."
    }
    assert "internal model details" not in response.text
    assert "Traceback" not in response.text


def test_health_endpoint_reports_up(monkeypatch):
    monkeypatch.setattr(main, "MODEL_PIPELINE", None)

    response = client.get("/ai/health")

    assert response.status_code == 200
    assert response.json()["status"] == "UP"
    assert response.json()["modelLoaded"] is False


def test_weekly_report_uses_local_template_without_api_key(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    response = client.post("/ai/generate-weekly-report", json={
        "petName": "초코",
        "species": "DOG",
        "age": 3,
        "avgTemperature": 38.5,
        "avgHeartRate": 100,
        "avgRespiratoryRate": 24,
        "cautionAlertCount": 0,
        "dangerAlertCount": 0,
        "questionnaireCount": 1,
        "averageRiskProbability": 0.2,
        "mainSymptomsSummary": "특이사항 없음",
    })

    assert response.status_code == 200
    assert response.json()["reportTitle"].startswith("초코의 주간")
    assert response.json()["recommendedCare"]


def test_food_recommendation_uses_local_template_without_api_key(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.setattr(main, "RAG_COLLECTION", None)
    response = client.post("/ai/recommend-food", json={
        "petName": "초코",
        "species": "DOG",
        "age": 3,
        "weight": 5.5,
        "healthConcerns": "피부",
    })

    assert response.status_code == 200
    assert response.json()["recommendedIngredients"]
    assert response.json()["feedingTips"]
