package com.petpulse.app.alert.service;

import com.petpulse.app.alert.dto.HealthAlertResponse;
import com.petpulse.app.alert.entity.HealthAlert;
import com.petpulse.app.alert.repository.HealthAlertRepository;
import com.petpulse.app.pet.repository.PetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HealthAlertService {

    private final HealthAlertRepository healthAlertRepository;
    private final PetRepository petRepository;

    public List<HealthAlertResponse> getAlertsByPet(Long petId) {

        if (!petRepository.existsById(petId)) {
            throw new IllegalArgumentException(
                    "존재하지 않는 반려동물입니다. petId=" + petId);
        }

        return healthAlertRepository
                .findByPetPetIdOrderByCreatedAtDesc(petId)
                .stream()
                .map(HealthAlertResponse::from)
                .toList();
    }

    @Transactional
    public HealthAlertResponse markAsRead(Long alertId) {

        HealthAlert alert = healthAlertRepository
                .findById(alertId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 알림입니다. alertId=" + alertId));

        alert.markAsRead();

        return HealthAlertResponse.from(alert);
    }

    @Transactional
    public int markAllAsRead(Long petId) {

        if (!petRepository.existsById(petId)) {
            throw new IllegalArgumentException(
                    "존재하지 않는 반려동물입니다. petId=" + petId);
        }

        List<HealthAlert> alerts = healthAlertRepository
                .findByPetPetIdOrderByCreatedAtDesc(petId);

        int updatedCount = 0;

        for (HealthAlert alert : alerts) {
            if (!alert.isRead()) {
                alert.markAsRead();
                updatedCount++;
            }
        }

        return updatedCount;
    }
}