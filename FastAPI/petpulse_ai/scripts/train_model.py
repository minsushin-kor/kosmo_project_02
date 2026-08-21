import os
import numpy as np
import joblib
import pandas as pd

from sklearn.utils.class_weight import compute_class_weight

# scikit-learn 전처리 및 평가 모듈
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OrdinalEncoder, OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, recall_score, precision_score

# 4개 비교 학습 머신러닝 알고리즘
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier


def train_and_evaluate():
    """
    4개 머신러닝 알고리즘(Logistic Regression, Random Forest, XGBoost, LightGBM)을
    동일한 데이터셋으로 비교 학습하고, 최적의 모델 파이프라인을 models/pet_risk_pipeline.pkl에 저장합니다.
    """
    # 1. 합성 데이터셋(CSV) 로드 검증
    csv_path = "data/pet_health_synthetic_dataset.csv"
    if not os.path.exists(csv_path):
        print(f"❌ [오류] 데이터 파일이 존재하지 않습니다: {csv_path}")
        print("💡 scripts/generate_data.py를 먼저 실행하여 데이터셋을 생성해주세요.")
        return

    try:
        df = pd.read_csv(csv_path)
        print(f"📊 총 {len(df)}건의 데이터를 정상적으로 로드했습니다.")
    except Exception as e:
        print(f"❌ [오류] CSV 데이터 로드 실패: {e}")
        return

    # 2. 타깃 라벨(y) 문자열 -> 정수 매핑 (XGBoost 0, 1, 2, 3 정수 규격 충족)
    label_mapping = {"NORMAL": 0, "WATCH": 1, "CAUTION": 2, "DANGER": 3}
    inverse_mapping = {0: "NORMAL", 1: "WATCH", 2: "CAUTION", 3: "DANGER"}

    if "riskGrade" not in df.columns:
        print("❌ [오류] 'riskGrade' 정답 타깃 컬럼이 데이터셋에 존재하지 않습니다.")
        return

    y = df["riskGrade"].map(label_mapping)
    X = df.drop(columns=["abnormalProbability", "riskGrade", "primaryRiskFactor"], errors="ignore")

    # 3. 데이터 타입 정제 (Boolean 피처를 0/1 정수형으로 안정적 변환)
    bool_cols = ["skinRedness", "itching", "hairLoss", "vomiting", "diarrhea"]
    for col in bool_cols:
        if col in X.columns:
            X[col] = X[col].astype(int)

    # 4. 피처 전처리기(ColumnTransformer) 구성
    num_cols = ["age", "weight", "temperature", "heartRate", "respiratoryRate", "symptomDurationDays"]
    ordinal_cols = ["appetiteLevel", "waterIntakeLevel", "activityLevel"]
    ordinal_cats = [
        ["NONE", "DECREASED", "NORMAL", "INCREASED"],  # 식욕
        ["DECREASED", "NORMAL", "INCREASED"],          # 음수량
        ["LOW", "NORMAL", "HIGH"]                      # 활동량
    ]
    onehot_cols = ["species"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), num_cols),
            ("ord", OrdinalEncoder(categories=ordinal_cats), ordinal_cols),
            ("onehot", OneHotEncoder(handle_unknown="ignore"), onehot_cols)
        ],
        remainder="passthrough"  # 이미 0/1 정수로 변환된 bool_cols는 그대로 유지
    )

    # 5. Train / Test Split (8:2 비율, 4개 등급 비율 균등 유지 stratify 적용)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # 6. 비교 학습할 4개 모델 정의 (오타 수정: eval_metric="mlogloss")
    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42, class_weight="balanced"),
        "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42, class_weight="balanced"),
        "XGBoost": XGBClassifier(random_state=42, eval_metric="mlogloss"),  # sample_weight로 별도 처리
        "LightGBM": LGBMClassifier(random_state=42, verbosity=-1, class_weight="balanced"),
    }

    print("\n🤖 4개 머신러닝 모델 비교 학습 및 평가를 시작합니다...")
    print("=" * 65)

    best_model_name = ""
    best_f1 = -1.0
    best_pipeline = None

    # 7. 모델별 학습 및 성능 지표 측정
    for name, clf in models.items():
        try:
            # 전처리기 + ML 모델을 하나의 Pipeline으로 결합
            pipeline = Pipeline(steps=[
                ("preprocessor", preprocessor),
                ("classifier", clf)
            ])

            # 모델 학습
            # XGBoost는 class_weight 파라미터를 직접 지원하지 않아 sample_weight로 별도 처리
            if name == "XGBoost":
                classes = np.unique(y_train)
                weights = compute_class_weight("balanced", classes=classes, y=y_train)
                weight_dict = dict(zip(classes.tolist(), weights.tolist()))
                sample_weights = np.array([weight_dict[int(y)] for y in y_train])
                pipeline.fit(X_train, y_train, classifier__sample_weight=sample_weights)
            else:
                pipeline.fit(X_train, y_train)

            # 예측 및 평가 지표 산출
            y_pred = pipeline.predict(X_test)

            acc = accuracy_score(y_test, y_pred)
            f1 = f1_score(y_test, y_pred, average="macro")
            recall = recall_score(y_test, y_pred, average="macro")
            precision = precision_score(y_test, y_pred, average="macro")

            print(f"🔹 [{name}]")
            print(f"   - Accuracy  : {acc:.4f}")
            print(f"   - F1-Score  : {f1:.4f}")
            print(f"   - Recall    : {recall:.4f}")
            print(f"   - Precision : {precision:.4f}")
            print("-" * 65)

            # 최고 성능 모델 갱신 (Macro F1-Score 기준)
            if f1 > best_f1:
                best_f1 = f1
                best_model_name = name
                best_pipeline = pipeline

        except Exception as e:
            print(f"❌ [{name}] 학습 중 오류 발생: {e}")
            print("-" * 65)

    if best_pipeline is None:
        print("❌ [오류] 정상적으로 학습된 모델이 없습니다.")
        return

    print(f"\n🏆 최종 선정된 최고 성능 모델: [{best_model_name}] (Macro F1-Score: {best_f1:.4f})")

    # 8a. 전처리 후 피처명 추출 (ColumnTransformer.get_feature_names_out)
    # FastAPI에서 SHAP 피처명을 한국어 요인으로 매핑하는 데 사용됨
    feature_names_out = []
    try:
        feature_names_out = list(best_pipeline.named_steps["preprocessor"].get_feature_names_out())
        print(f"✅ 전처리 후 피처명 추출 성공: {len(feature_names_out)}개")
    except Exception as e:
        print(f"⚠️ 피처명 추출 실패 (scikit-learn >= 1.0 필요): {e}")

    # 8b. SHAP TreeExplainer 생성 (XGBoost, LightGBM, RandomForest 등 트리 기반 모델에 한함)
    # shap.TreeExplainer는 각 예측에 대한 피처별 기여도(SHAP values)를 계산함
    shap_explainer = None
    try:
        import shap
        classifier = best_pipeline.named_steps["classifier"]
        if hasattr(classifier, "feature_importances_"):
            shap_explainer = shap.TreeExplainer(classifier)
            print(f"✅ SHAP TreeExplainer 생성 완료 ({best_model_name}) → pkl에 함께 저장됩니다.")
        else:
            print(f"ℹ️ {best_model_name}은 SHAP TreeExplainer 미지원 (feature_importances_ 없음)")
    except ImportError:
        print("⚠️ shap 미설치 → pip install shap 후 재학습 권장")
    except Exception as e:
        print(f"⚠️ SHAP TreeExplainer 생성 실패: {e}")

    # 8c. models/ 폴더 생성 및 파이프라인 패키징 저장 (FastAPI 연동용)
    os.makedirs("models", exist_ok=True)
    save_path = "models/pet_risk_pipeline.pkl"

    saved_data = {
        "pipeline": best_pipeline,
        "label_mapping": label_mapping,
        "inverse_mapping": inverse_mapping,
        "feature_names": list(X.columns),
        "feature_names_out": feature_names_out,   # 전처리 후 피처명 (SHAP 매핑용)
        "shap_explainer": shap_explainer,           # SHAP Explainer (per-sample 근거 추출용)
    }

    try:
        joblib.dump(saved_data, save_path)
        print(f"✅ 최고 성능 모델 파이프라인 및 메타데이터 저장 완료: {save_path}\n")
    except Exception as e:
        print(f"❌ [오류] 모델 파일 저장 실패: {e}")


if __name__ == "__main__":
    train_and_evaluate()