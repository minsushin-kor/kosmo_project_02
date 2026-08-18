import random
import numpy as np
import pandas as pd


# =====================================================================
# 종별(Species) 생체 임계값 상수 정의
# =====================================================================
# 수의학 일반 기준에 따라 강아지(DOG)와 고양이(CAT)의 정상 생체 범위가 다름
# - 강아지 정상 체온: 37.5~39.2°C  / 고양이 정상 체온: 38.0~39.5°C
# - 강아지 정상 심박수: 60~140bpm  / 고양이 정상 심박수: 120~220bpm

SPECIES_THRESHOLDS = {
    "DOG": {
        "temp_mild_fever":  39.3,   # 미열 기준
        "temp_high_fever":  40.0,   # 고열 기준
        "hr_tachycardia":   160,    # 빈맥 기준 (bpm)
        "rr_tachypnea":     40,     # 빠른 호흡 기준 (회/분)
    },
    "CAT": {
        "temp_mild_fever":  39.6,   # 고양이는 정상 체온 상한이 더 높음 (38.0~39.5°C)
        "temp_high_fever":  40.5,   # 고양이 고열 기준
        "hr_tachycardia":   240,    # 고양이 정상 심박수 상한이 220bpm → 빈맥 기준 높게
        "rr_tachypnea":     40,     # 호흡수 기준은 동일
    },
}


# =====================================================================
# 내부 헬퍼: 점수 계산 및 등급 결정
# =====================================================================
def _compute_score_and_label(species, temp, heart_rate, resp_rate,
                              skin_redness, itching, hair_loss,
                              vomiting, diarrhea, appetite, activity,
                              noise_std=0.08):
    """
    증상 값으로부터 이상 점수를 계산하고 riskGrade를 반환합니다.
    species(종)별로 다른 생체 임계값을 적용합니다.
    σ=0.08 가우시안 노이즈로 데이터 결정론(data leakage)을 방지합니다.
    """
    thr = SPECIES_THRESHOLDS.get(species, SPECIES_THRESHOLDS["DOG"])
    score = 0.0
    risk_factors = []

    # (1) 체온 — 종별 임계값 적용
    if temp >= thr["temp_high_fever"]:
        score += 0.40; risk_factors.append("고열")
    elif temp >= thr["temp_mild_fever"]:
        score += 0.20; risk_factors.append("미열")

    # (2) 심박수 / 호흡수 — 심박수는 종별, 호흡수는 공통
    if heart_rate >= thr["hr_tachycardia"]:
        score += 0.20; risk_factors.append("빈맥")
    if resp_rate >= thr["rr_tachypnea"]:
        score += 0.25; risk_factors.append("호흡 급증")

    # (3) 소화기
    if vomiting and diarrhea:
        score += 0.35; risk_factors.append("소화기 이상(구토 및 설사)")
    elif vomiting:
        score += 0.20; risk_factors.append("구토")
    elif diarrhea:
        score += 0.15; risk_factors.append("설사")

    # (4) 피부
    if skin_redness or itching or hair_loss:
        score += 0.15; risk_factors.append("피부 징후")

    # (5) 생활 문진
    if appetite == "NONE":
        score += 0.25; risk_factors.append("식욕 절폐")
    elif appetite == "DECREASED":
        score += 0.10; risk_factors.append("식욕 감소")
    if activity == "LOW":
        score += 0.10; risk_factors.append("활동량 저하")

    # (6) 가우시안 노이즈 (σ=0.08 → 결정론적 패턴 완화)
    score += float(np.random.normal(0, noise_std))
    score = max(0.0, score)
    abnormal_prob = round(min(score, 1.0), 2)

    # (7) 위험 등급 결정
    if abnormal_prob < 0.30:
        risk_grade = "NORMAL"
    elif abnormal_prob < 0.50:
        risk_grade = "WATCH"
    elif abnormal_prob < 0.75:
        risk_grade = "CAUTION"
    else:
        risk_grade = "DANGER"

    # (8) primaryRiskFactor
    if risk_grade == "NORMAL" or not risk_factors:
        primary_factor = "이상 없음(정상)"
    else:
        primary_factor = ", ".join(risk_factors[:2])

    return abnormal_prob, risk_grade, primary_factor


def _generate_base_info():
    """종, 나이, 체중 기본 정보 생성."""
    species = random.choice(["DOG", "CAT"])
    age = random.randint(1, 15)
    weight = (round(random.uniform(2.5, 30.0), 1) if species == "DOG"
              else round(random.uniform(2.0, 8.0), 1))
    return species, age, weight


def _generate_symptoms_by_profile(target_class, species):
    """
    목표 위험 등급과 종(species)에 편향된 증상 프로파일을 생성합니다.
    클래스 간 경계를 의도적으로 겹치게 설계하여 현실적인 분류 난이도를 구현합니다.

    종별 분포 차이:
    - 체온: DOG는 낮은 임계값 기준, CAT은 높은 임계값 기준으로 분포 설정
    - 심박수: CAT은 DOG보다 정상 범위가 훨씬 높으므로 등급별 평균값도 높게 설정

    결과: 경계 근처 샘플의 자연스러운 혼재 → 목표 Macro F1 0.75~0.85
    """
    if species == "CAT":
        # ── 고양이 프로파일 ──────────────────────────────────────────
        # 정상 체온 상한: 39.5°C / 심박수 정상 상한: 220bpm
        if target_class == "NORMAL":
            temp       = max(37.0, min(40.0, round(np.random.normal(38.9, 0.50), 1)))
            heart_rate = max(100,  min(230,  int(np.random.normal(170, 28))))
            resp_rate  = max(10,   min(42,   int(np.random.normal(24, 7))))
            skin_redness = random.random() < 0.10
            itching      = random.random() < 0.10
            hair_loss    = random.random() < 0.06
            vomiting     = random.random() < 0.10
            diarrhea     = random.random() < 0.10
            appetite = random.choices(["NONE","DECREASED","NORMAL","INCREASED"], weights=[ 1,  8, 82,  9])[0]
            water    = random.choices(["DECREASED","NORMAL","INCREASED"],         weights=[ 8, 82, 10])[0]
            activity = random.choices(["LOW","NORMAL","HIGH"],                    weights=[10, 75, 15])[0]

        elif target_class == "WATCH":
            temp       = max(38.0, min(40.5, round(np.random.normal(39.3, 0.48), 1)))
            heart_rate = max(120,  min(255,  int(np.random.normal(210, 28))))
            resp_rate  = max(12,   min(46,   int(np.random.normal(28, 9))))
            skin_redness = random.random() < 0.25
            itching      = random.random() < 0.25
            hair_loss    = random.random() < 0.15
            vomiting     = random.random() < 0.28
            diarrhea     = random.random() < 0.28
            appetite = random.choices(["NONE","DECREASED","NORMAL","INCREASED"], weights=[ 5, 38, 52,  5])[0]
            water    = random.choices(["DECREASED","NORMAL","INCREASED"],         weights=[22, 63, 15])[0]
            activity = random.choices(["LOW","NORMAL","HIGH"],                    weights=[33, 57, 10])[0]

        elif target_class == "CAUTION":
            temp       = max(38.8, min(41.2, round(np.random.normal(39.9, 0.45), 1)))
            heart_rate = max(150,  min(275,  int(np.random.normal(245, 28))))
            resp_rate  = max(22,   min(58,   int(np.random.normal(39, 9))))
            skin_redness = random.random() < 0.42
            itching      = random.random() < 0.42
            hair_loss    = random.random() < 0.25
            vomiting     = random.random() < 0.48
            diarrhea     = random.random() < 0.48
            appetite = random.choices(["NONE","DECREASED","NORMAL","INCREASED"], weights=[20, 55, 23,  2])[0]
            water    = random.choices(["DECREASED","NORMAL","INCREASED"],         weights=[47, 46,  7])[0]
            activity = random.choices(["LOW","NORMAL","HIGH"],                    weights=[65, 30,  5])[0]

        else:  # DANGER
            temp       = max(39.8, min(42.0, round(np.random.normal(40.7, 0.45), 1)))
            heart_rate = max(200,  min(300,  int(np.random.normal(262, 28))))
            resp_rate  = max(34,   min(72,   int(np.random.normal(49, 10))))
            skin_redness = random.random() < 0.55
            itching      = random.random() < 0.55
            hair_loss    = random.random() < 0.35
            vomiting     = random.random() < 0.68
            diarrhea     = random.random() < 0.68
            appetite = random.choices(["NONE","DECREASED","NORMAL","INCREASED"], weights=[50, 40,  9,  1])[0]
            water    = random.choices(["DECREASED","NORMAL","INCREASED"],         weights=[65, 30,  5])[0]
            activity = random.choices(["LOW","NORMAL","HIGH"],                    weights=[84, 13,  3])[0]

    else:
        # ── 강아지 프로파일 (DOG) ────────────────────────────────────
        # 정상 체온 상한: 39.2°C / 심박수 정상 상한: 140bpm
        if target_class == "NORMAL":
            temp       = max(36.5, min(39.7, round(np.random.normal(38.5, 0.50), 1)))
            heart_rate = max(50,   min(160,  int(np.random.normal(105, 22))))
            resp_rate  = max(10,   min(42,   int(np.random.normal(24, 7))))
            skin_redness = random.random() < 0.10
            itching      = random.random() < 0.10
            hair_loss    = random.random() < 0.06
            vomiting     = random.random() < 0.10
            diarrhea     = random.random() < 0.10
            appetite = random.choices(["NONE","DECREASED","NORMAL","INCREASED"], weights=[ 1,  8, 82,  9])[0]
            water    = random.choices(["DECREASED","NORMAL","INCREASED"],         weights=[ 8, 82, 10])[0]
            activity = random.choices(["LOW","NORMAL","HIGH"],                    weights=[10, 75, 15])[0]

        elif target_class == "WATCH":
            temp       = max(37.5, min(40.2, round(np.random.normal(39.0, 0.48), 1)))
            heart_rate = max(60,   min(178,  int(np.random.normal(125, 28))))
            resp_rate  = max(12,   min(46,   int(np.random.normal(28, 9))))
            skin_redness = random.random() < 0.25
            itching      = random.random() < 0.25
            hair_loss    = random.random() < 0.15
            vomiting     = random.random() < 0.28
            diarrhea     = random.random() < 0.28
            appetite = random.choices(["NONE","DECREASED","NORMAL","INCREASED"], weights=[ 5, 38, 52,  5])[0]
            water    = random.choices(["DECREASED","NORMAL","INCREASED"],         weights=[22, 63, 15])[0]
            activity = random.choices(["LOW","NORMAL","HIGH"],                    weights=[33, 57, 10])[0]

        elif target_class == "CAUTION":
            temp       = max(38.5, min(40.8, round(np.random.normal(39.6, 0.45), 1)))
            heart_rate = max(90,   min(200,  int(np.random.normal(150, 28))))
            resp_rate  = max(22,   min(58,   int(np.random.normal(39, 9))))
            skin_redness = random.random() < 0.42
            itching      = random.random() < 0.42
            hair_loss    = random.random() < 0.25
            vomiting     = random.random() < 0.48
            diarrhea     = random.random() < 0.48
            appetite = random.choices(["NONE","DECREASED","NORMAL","INCREASED"], weights=[20, 55, 23,  2])[0]
            water    = random.choices(["DECREASED","NORMAL","INCREASED"],         weights=[47, 46,  7])[0]
            activity = random.choices(["LOW","NORMAL","HIGH"],                    weights=[65, 30,  5])[0]

        else:  # DANGER
            temp       = max(39.5, min(41.5, round(np.random.normal(40.2, 0.45), 1)))
            heart_rate = max(130,  min(230,  int(np.random.normal(168, 28))))
            resp_rate  = max(34,   min(72,   int(np.random.normal(49, 10))))
            skin_redness = random.random() < 0.55
            itching      = random.random() < 0.55
            hair_loss    = random.random() < 0.35
            vomiting     = random.random() < 0.68
            diarrhea     = random.random() < 0.68
            appetite = random.choices(["NONE","DECREASED","NORMAL","INCREASED"], weights=[50, 40,  9,  1])[0]
            water    = random.choices(["DECREASED","NORMAL","INCREASED"],         weights=[65, 30,  5])[0]
            activity = random.choices(["LOW","NORMAL","HIGH"],                    weights=[84, 13,  3])[0]

    has_symptom = (skin_redness or vomiting or diarrhea
                   or appetite != "NORMAL" or activity != "NORMAL")
    symptom_days = random.randint(0, 7) if has_symptom else 0

    return (temp, heart_rate, resp_rate, skin_redness, itching, hair_loss,
            vomiting, diarrhea, appetite, water, activity, symptom_days)


# =====================================================================
# 메인 데이터 생성 함수
# =====================================================================
def generate_pet_synthetic_data(num_samples=10000, seed=42):
    """
    3:2:2:2 비율(NORMAL:WATCH:CAUTION:DANGER)로 균형 잡힌 합성 데이터를 생성합니다.

    개선 사항 (v2):
    - 강아지/고양이 종별로 다른 생체 임계값 적용 (체온, 심박수)
    - 10,000건으로 데이터 규모 유지
    - 클래스별 편향 증상 프로파일(profile-based) + rejection sampling으로 3:2:2:2 달성
    - 가우시안 노이즈 σ=0.08 (결정론적 패턴 완화)
    """
    np.random.seed(seed)
    random.seed(seed)

    # 3:2:2:2 목표 샘플 수 계산 (9등분)
    part = num_samples // 9
    class_targets = {
        "NORMAL":  part * 3,
        "WATCH":   part * 2,
        "CAUTION": part * 2,
        "DANGER":  num_samples - part * 7,  # 나머지 전부 (반올림 오차 흡수)
    }
    print(f"[목표] 클래스 분포 (3:2:2:2): {class_targets}")

    data = []
    class_counts = {k: 0 for k in class_targets}
    attempts = 0
    max_attempts = num_samples * 30  # 안전 상한선

    while sum(class_counts.values()) < num_samples and attempts < max_attempts:
        # 부족한 클래스에 가중치를 두어 목표 클래스 선택
        remaining = {k: max(0, class_targets[k] - class_counts[k]) for k in class_targets}
        if sum(remaining.values()) == 0:
            break

        target = random.choices(
            list(remaining.keys()),
            weights=list(remaining.values())
        )[0]

        # 종(species)을 먼저 결정한 뒤 프로파일 및 점수 계산에 전달
        species, age, weight = _generate_base_info()
        (temp, heart_rate, resp_rate, skin_redness, itching, hair_loss,
         vomiting, diarrhea, appetite, water, activity, symptom_days) = _generate_symptoms_by_profile(target, species)

        # 실제 점수 계산 (종별 임계값 + 노이즈 포함)
        abnormal_prob, risk_grade, primary_factor = _compute_score_and_label(
            species, temp, heart_rate, resp_rate, skin_redness, itching, hair_loss,
            vomiting, diarrhea, appetite, activity
        )

        # 실제 등급이 목표와 일치하고 아직 목표치 미달인 경우만 수집 (rejection sampling)
        if risk_grade == target and class_counts[target] < class_targets[target]:
            data.append({
                "species": species, "age": age, "weight": weight,
                "temperature": temp, "heartRate": heart_rate,
                "respiratoryRate": resp_rate,
                "skinRedness": skin_redness, "itching": itching, "hairLoss": hair_loss,
                "vomiting": vomiting, "diarrhea": diarrhea,
                "appetiteLevel": appetite, "waterIntakeLevel": water,
                "activityLevel": activity, "symptomDurationDays": symptom_days,
                "abnormalProbability": abnormal_prob,
                "riskGrade": risk_grade,
                "primaryRiskFactor": primary_factor,
            })
            class_counts[risk_grade] += 1

        attempts += 1

    print(f"[완료] 실제 생성 분포: {class_counts}  (총 시도: {attempts}회)")

    df = pd.DataFrame(data)
    df = df.sample(frac=1, random_state=seed).reset_index(drop=True)  # 셔플
    return df


if __name__ == "__main__":
    df = generate_pet_synthetic_data(num_samples=10000)

    import os
    os.makedirs("data", exist_ok=True)
    file_path = "data/pet_health_synthetic_dataset.csv"
    df.to_csv(file_path, index=False, encoding="utf-8-sig")

    print(f"[완료] {len(df)}건의 합성 데이터 생성 완료: {file_path}")
    print("\n[분포] 최종 클래스 분포:")
    print(df['riskGrade'].value_counts())
    print("\n[비율]")
    print(df['riskGrade'].value_counts(normalize=True).round(3))
    print("\n[종별 분포]")
    print(df.groupby(['species', 'riskGrade']).size().unstack(fill_value=0))