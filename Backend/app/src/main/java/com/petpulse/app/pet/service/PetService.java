package com.petpulse.app.pet.service;

import com.petpulse.app.pet.dto.PetRequest;
import com.petpulse.app.pet.dto.PetResponse;
import com.petpulse.app.pet.entity.Pet;
import com.petpulse.app.pet.repository.PetRepository;
import com.petpulse.app.global.exception.BusinessException;
import com.petpulse.app.global.exception.ErrorCode;
import com.petpulse.app.user.entity.User;
import com.petpulse.app.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PetService {

    private final PetRepository petRepository;
    private final UserRepository userRepository;

    @Transactional
    public PetResponse createPet(String loginId, PetRequest request) {

        User user = findUser(loginId);

        Pet pet = new Pet(
                user,
                request.petName(),
                request.species(),
                request.breed(),
                request.birthDate(),
                request.gender(),
                request.weight(),
                request.neutered(),
                request.medicalHistory(),
                request.profileImageUrl());

        Pet savedPet = petRepository.save(pet);

        return toResponse(savedPet);
    }

    public List<PetResponse> getPets(String loginId) {
        User user = findUser(loginId);

        return petRepository
                .findByUserUserIdOrderByCreatedAtDesc(user.getUserId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public PetResponse getPet(String loginId, Long petId) {

        User user = findUser(loginId);
        Pet pet = findOwnedPet(petId, user.getUserId());

        return toResponse(pet);
    }

    @Transactional
    public PetResponse updatePet(
            String loginId,
            Long petId,
            PetRequest request) {

        User user = findUser(loginId);
        Pet pet = findOwnedPet(petId, user.getUserId());

        pet.update(
                request.petName(),
                request.species(),
                request.breed(),
                request.birthDate(),
                request.gender(),
                request.weight(),
                request.neutered(),
                request.medicalHistory(),
                pet.getProfileImageUrl());

        return toResponse(pet);
    }

    @Transactional
    public void deletePet(String loginId, Long petId) {

        User user = findUser(loginId);
        Pet pet = findOwnedPet(petId, user.getUserId());

        petRepository.delete(pet);
    }

    private User findUser(String loginId) {
        return userRepository.findByLoginId(loginId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.AUTHENTICATION_FAILED,
                        "인증된 사용자를 찾을 수 없습니다."));
    }

    private Pet findOwnedPet(Long petId, Long userId) {
        return petRepository.findByPetIdAndUserUserId(petId, userId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        "반려동물을 찾을 수 없습니다."));
    }

    private PetResponse toResponse(Pet pet) {

        return new PetResponse(
                pet.getPetId(),
                pet.getUser().getUserId(),
                pet.getPetName(),
                pet.getSpecies(),
                pet.getBreed(),
                pet.getBirthDate(),
                pet.getGender(),
                pet.getWeight(),
                pet.getNeutered(),
                pet.getMedicalHistory(),
                pet.getProfileImageUrl(),
                pet.getCreatedAt());
    }
}
