import pytest
from fastapi import HTTPException

from app import main


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


def test_inference_exception_returns_generic_service_error(monkeypatch):
    class FailingModel:
        def predict_proba(self, _data):
            raise RuntimeError("internal model details")

    monkeypatch.setattr(main, "MODEL_PIPELINE", FailingModel())

    with pytest.raises(HTTPException) as raised:
        main.predict_health_risk(request())

    assert raised.value.status_code == 503
    assert raised.value.detail == "건강 위험도 예측 서비스를 일시적으로 사용할 수 없습니다."
    assert "internal model details" not in raised.value.detail
