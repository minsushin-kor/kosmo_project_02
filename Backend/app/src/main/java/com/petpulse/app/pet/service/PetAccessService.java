package com.petpulse.app.pet.service;

import com.petpulse.app.global.exception.BusinessException;
import com.petpulse.app.global.exception.ErrorCode;
import com.petpulse.app.pet.entity.Pet;
import com.petpulse.app.pet.repository.PetRepository;
import com.petpulse.app.user.entity.User;
import com.petpulse.app.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PetAccessService {
    private final UserRepository userRepository;
    private final PetRepository petRepository;

    public Pet requireOwnedPet(String loginId, Long petId) {
        User user = userRepository.findByLoginId(loginId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.AUTHENTICATION_FAILED,
                        "인증된 사용자를 찾을 수 없습니다."));

        return petRepository.findByPetIdAndUserUserId(petId, user.getUserId())
                .orElseThrow(() -> notFound("반려동물을 찾을 수 없습니다."));
    }

    public BusinessException notFound(String message) {
        return new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, message);
    }
}
