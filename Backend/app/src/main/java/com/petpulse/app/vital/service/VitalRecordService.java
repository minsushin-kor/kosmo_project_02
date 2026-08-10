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

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VitalRecordService {

    private final VitalRecordRepository vitalRecordRepository;
    private final PetRepository petRepository;

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

        VitalRecord vitalRecord = new VitalRecord(
                pet,
                request.temperature(),
                request.heartRate(),
                request.respiratoryRate(),
                measuredAt,
                request.sourceType(),
                VitalStatus.NORMAL);

        VitalRecord savedVitalRecord = vitalRecordRepository.save(vitalRecord);

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
}