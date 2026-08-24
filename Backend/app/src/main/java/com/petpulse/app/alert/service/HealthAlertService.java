package com.petpulse.app.alert.service;

import com.petpulse.app.alert.dto.HealthAlertResponse;
import com.petpulse.app.alert.entity.HealthAlert;
import com.petpulse.app.alert.repository.HealthAlertRepository;
import com.petpulse.app.pet.service.PetAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HealthAlertService {

    private final HealthAlertRepository healthAlertRepository;
    private final PetAccessService petAccessService;

    public List<HealthAlertResponse> getAlertsByPet(String loginId, Long petId) {

        petAccessService.requireOwnedPet(loginId, petId);

        return healthAlertRepository
                .findByPetPetIdOrderByCreatedAtDesc(petId)
                .stream()
                .map(HealthAlertResponse::from)
                .toList();
    }

    @Transactional
    public HealthAlertResponse markAsRead(String loginId, Long alertId) {

        HealthAlert alert = healthAlertRepository
                .findByAlertIdAndPetUserLoginId(alertId, loginId)
                .orElseThrow(() -> petAccessService.notFound("알림을 찾을 수 없습니다."));

        alert.markAsRead();

        return HealthAlertResponse.from(alert);
    }

    @Transactional
    public int markAllAsRead(String loginId, Long petId) {

        petAccessService.requireOwnedPet(loginId, petId);

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
