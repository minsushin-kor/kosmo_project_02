package com.petpulse.app.vital.service;

import com.petpulse.app.pet.entity.Pet;
import com.petpulse.app.pet.repository.PetRepository;
import com.petpulse.app.vital.dto.VitalRecordRequest;
import com.petpulse.app.vital.dto.VitalRecordResponse;
import com.petpulse.app.vital.entity.VitalRecord;
import com.petpulse.app.vital.entity.VitalStatus;
import com.petpulse.app.vital.repository.VitalRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.petpulse.app.alert.entity.AlertSeverity;
import com.petpulse.app.alert.entity.HealthAlert;
import com.petpulse.app.alert.entity.HealthAlertType;
import com.petpulse.app.alert.repository.HealthAlertRepository;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VitalRecordService {

        private final VitalRecordRepository vitalRecordRepository;
        private final PetRepository petRepository;
        private final HealthAlertRepository healthAlertRepository;

        @Transactional
        public VitalRecordResponse createVitalRecord(
                        Long petId,
                        VitalRecordRequest request) {

                Pet pet = petRepository.findById(petId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "존재하지 않는 반려동물입니다. petId=" + petId));

                LocalDateTime measuredAt = request.measuredAt() != null
                                ? request.measuredAt()
                                : LocalDateTime.now();

                VitalStatus status = determineStatus(
                                pet,
                                request.temperature(),
                                request.heartRate(),
                                request.respiratoryRate());

                VitalRecord vitalRecord = new VitalRecord(
                                pet,
                                request.temperature(),
                                request.heartRate(),
                                request.respiratoryRate(),
                                measuredAt,
                                request.sourceType(),
                                status);

                VitalRecord savedVitalRecord = vitalRecordRepository.save(vitalRecord);

                createVitalAlertIfNeeded(
                                pet,
                                savedVitalRecord);

                return toResponse(savedVitalRecord);
        }

        public VitalRecordResponse getLatestVitalRecord(Long petId) {

                if (!petRepository.existsById(petId)) {
                        throw new IllegalArgumentException(
                                        "존재하지 않는 반려동물입니다. petId=" + petId);
                }

                VitalRecord vitalRecord = vitalRecordRepository
                                .findFirstByPetPetIdOrderByMeasuredAtDesc(petId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "등록된 생체정보가 없습니다. petId=" + petId));

                return toResponse(vitalRecord);
        }

        public List<VitalRecordResponse> getVitalRecords(Long petId) {

                if (!petRepository.existsById(petId)) {
                        throw new IllegalArgumentException(
                                        "존재하지 않는 반려동물입니다. petId=" + petId);
                }

                return vitalRecordRepository
                                .findByPetPetIdOrderByMeasuredAtDesc(petId)
                                .stream()
                                .map(this::toResponse)
                                .toList();
        }

        private VitalRecordResponse toResponse(VitalRecord vitalRecord) {

                return new VitalRecordResponse(
                                vitalRecord.getVitalRecordId(),
                                vitalRecord.getPet().getPetId(),
                                vitalRecord.getTemperature(),
                                vitalRecord.getHeartRate(),
                                vitalRecord.getRespiratoryRate(),
                                vitalRecord.getMeasuredAt(),
                                vitalRecord.getSourceType(),
                                vitalRecord.getStatus());
        }

        private VitalStatus determineStatus(
                        Pet pet,
                        BigDecimal temperature,
                        Integer heartRate,
                        Integer respiratoryRate) {

                double temp = temperature.doubleValue();

                boolean isDog = pet.getSpecies().name().equals("DOG");

                if (isDog) {
                        if (temp >= 40.5
                                        || heartRate >= 180
                                        || respiratoryRate >= 50) {
                                return VitalStatus.DANGER;
                        }

                        if (temp >= 40.0
                                        || heartRate >= 160
                                        || respiratoryRate >= 40) {
                                return VitalStatus.CAUTION;
                        }

                        if (temp >= 39.5
                                        || temp < 37.5
                                        || heartRate >= 140
                                        || respiratoryRate >= 35) {
                                return VitalStatus.WATCH;
                        }

                        return VitalStatus.NORMAL;
                }

                if (temp >= 40.5
                                || heartRate >= 220
                                || respiratoryRate >= 50) {
                        return VitalStatus.DANGER;
                }

                if (temp >= 40.0
                                || heartRate >= 200
                                || respiratoryRate >= 40) {
                        return VitalStatus.CAUTION;
                }

                if (temp >= 39.5
                                || temp < 37.5
                                || heartRate >= 180
                                || respiratoryRate >= 35) {
                        return VitalStatus.WATCH;
                }

                return VitalStatus.NORMAL;
        }

        private void createVitalAlertIfNeeded(
                        Pet pet,
                        VitalRecord vitalRecord) {

                VitalStatus status = vitalRecord.getStatus();

                if (status == VitalStatus.NORMAL) {
                        return;
                }

                AlertSeverity severity = AlertSeverity.valueOf(
                                status.name());

                String title = switch (severity) {
                        case WATCH ->
                                "생체정보 관찰이 필요합니다.";
                        case CAUTION ->
                                "생체정보에 주의가 필요합니다.";
                        case DANGER ->
                                "위험한 생체정보가 감지되었습니다.";
                };

                String message = buildVitalAlertMessage(
                                vitalRecord,
                                severity);

                HealthAlert alert = new HealthAlert(
                                pet,
                                null,
                                HealthAlertType.VITAL,
                                severity,
                                title,
                                message);

                healthAlertRepository.save(alert);
        }

        private String buildVitalAlertMessage(
                        VitalRecord vitalRecord,
                        AlertSeverity severity) {

                String vitalSummary = "체온 "
                                + vitalRecord.getTemperature()
                                + "℃, 심박수 "
                                + vitalRecord.getHeartRate()
                                + "bpm, 호흡수 "
                                + vitalRecord.getRespiratoryRate()
                                + "회/분";

                return switch (severity) {
                        case WATCH ->
                                vitalSummary
                                                + "이 기록되었습니다. "
                                                + "상태 변화를 지속적으로 관찰해 주세요.";

                        case CAUTION ->
                                vitalSummary
                                                + "이 기록되어 주의가 필요합니다. "
                                                + "생체정보를 다시 확인해 주세요.";

                        case DANGER ->
                                vitalSummary
                                                + "이 기록되어 위험 신호가 확인되었습니다. "
                                                + "상태가 지속되거나 악화되면 전문가 상담을 고려해 주세요.";
                };
        }
}