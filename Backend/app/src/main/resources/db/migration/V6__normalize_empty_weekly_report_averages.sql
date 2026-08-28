UPDATE weekly_reports
SET average_temperature = NULL
WHERE average_temperature = 0;

UPDATE weekly_reports
SET average_heart_rate = NULL
WHERE average_heart_rate = 0;

UPDATE weekly_reports
SET average_risk_probability = NULL
WHERE average_risk_probability = 0
  AND questionnaire_count = 0;
