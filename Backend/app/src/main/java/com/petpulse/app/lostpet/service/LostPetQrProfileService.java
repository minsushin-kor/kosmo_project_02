package com.petpulse.app.lostpet.service;

import com.petpulse.app.global.exception.BusinessException;
import com.petpulse.app.global.exception.ErrorCode;
import com.petpulse.app.lostpet.dto.LostPetQrProfileResponse;
import com.petpulse.app.lostpet.dto.PublicLostPetProfileResponse;
import com.petpulse.app.lostpet.entity.PetLostQrProfile;
import com.petpulse.app.lostpet.repository.PetLostQrProfileRepository;
import com.petpulse.app.pet.entity.Pet;
import com.petpulse.app.pet.service.PetAccessService;
import com.petpulse.app.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LostPetQrProfileService {
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int TOKEN_BYTES = 24;

    private final PetLostQrProfileRepository profileRepository;
    private final PetAccessService petAccessService;

    public LostPetQrProfileResponse getProfile(String loginId, Long petId) {
        Pet pet = petAccessService.requireOwnedPet(loginId, petId);
        PetLostQrProfile profile = profileRepository.findByPetPetId(pet.getPetId())
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        "아직 생성된 실종 대비 QR이 없습니다."));
        return toOwnerResponse(profile);
    }

    @Transactional
    public LostPetQrProfileResponse createProfile(String loginId, Long petId) {
        Pet pet = petAccessService.requireOwnedPet(loginId, petId);
        validatePhone(pet.getUser());

        return profileRepository.findByPetPetId(pet.getPetId())
                .map(this::toOwnerResponse)
                .orElseGet(() -> {
                    PetLostQrProfile saved = profileRepository.save(
                            new PetLostQrProfile(pet, generateUniqueToken()));
                    return toOwnerResponse(saved);
                });
    }

    @Transactional
    public LostPetQrProfileResponse updateActive(
            String loginId,
            Long petId,
            boolean active) {
        PetLostQrProfile profile = requireOwnedProfile(loginId, petId);
        if (active) {
            validatePhone(profile.getPet().getUser());
        }
        profile.updateActive(active);
        return toOwnerResponse(profile);
    }

    @Transactional
    public LostPetQrProfileResponse rotateToken(String loginId, Long petId) {
        PetLostQrProfile profile = requireOwnedProfile(loginId, petId);
        profile.rotateToken(generateUniqueToken());
        return toOwnerResponse(profile);
    }

    public PublicLostPetProfileResponse getPublicProfile(String publicToken) {
        PetLostQrProfile profile = profileRepository
                .findByPublicTokenAndActiveTrue(publicToken)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        "유효한 실종 대비 프로필을 찾을 수 없습니다."));

        Pet pet = profile.getPet();
        User guardian = pet.getUser();
        if (guardian.getPhone() == null || guardian.getPhone().isBlank()) {
            throw new BusinessException(
                    ErrorCode.RESOURCE_NOT_FOUND,
                    "현재 보호자 연락처를 확인할 수 없습니다.");
        }
        return new PublicLostPetProfileResponse(
                guardian.getUserName(),
                guardian.getPhone(),
                pet.getPetName(),
                pet.getSpecies().name(),
                pet.getMedicalHistory());
    }

    private PetLostQrProfile requireOwnedProfile(String loginId, Long petId) {
        Pet pet = petAccessService.requireOwnedPet(loginId, petId);
        return profileRepository.findByPetPetId(pet.getPetId())
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        "아직 생성된 실종 대비 QR이 없습니다."));
    }

    private LostPetQrProfileResponse toOwnerResponse(PetLostQrProfile profile) {
        Pet pet = profile.getPet();
        User guardian = pet.getUser();
        return new LostPetQrProfileResponse(
                profile.getPublicToken(),
                profile.isActive(),
                guardian.getUserName(),
                guardian.getPhone(),
                pet.getPetName(),
                pet.getSpecies().name(),
                pet.getMedicalHistory());
    }

    private void validatePhone(User guardian) {
        if (guardian.getPhone() == null || guardian.getPhone().isBlank()) {
            throw new BusinessException(
                    ErrorCode.INVALID_REQUEST,
                    "보호자 연락처를 등록한 후 QR을 생성해 주세요.");
        }
    }

    private String generateUniqueToken() {
        for (int attempt = 0; attempt < 10; attempt++) {
            byte[] bytes = new byte[TOKEN_BYTES];
            SECURE_RANDOM.nextBytes(bytes);
            String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
            if (!profileRepository.existsByPublicToken(token)) {
                return token;
            }
        }
        throw new BusinessException(
                ErrorCode.INTERNAL_SERVER_ERROR,
                "QR 공개 주소를 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
}
