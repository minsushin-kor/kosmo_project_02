package com.petpulse.app.pet.service;

import com.petpulse.app.pet.dto.PetRequest;
import com.petpulse.app.pet.dto.PetResponse;
import com.petpulse.app.pet.entity.Pet;
import com.petpulse.app.pet.repository.PetRepository;
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
    public PetResponse createPet(PetRequest request) {

        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 사용자입니다. userId=" + request.userId()));

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

    public List<PetResponse> getPets(Long userId) {

        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException(
                    "존재하지 않는 사용자입니다. userId=" + userId);
        }

        return petRepository
                .findByUserUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public PetResponse getPet(Long petId) {

        Pet pet = findPet(petId);

        return toResponse(pet);
    }

    @Transactional
    public PetResponse updatePet(
            Long petId,
            PetRequest request) {

        Pet pet = findPet(petId);

        if (!pet.getUser().getUserId().equals(request.userId())) {
            throw new IllegalArgumentException(
                    "해당 사용자의 반려동물이 아닙니다.");
        }

        pet.update(
                request.petName(),
                request.species(),
                request.breed(),
                request.birthDate(),
                request.gender(),
                request.weight(),
                request.neutered(),
                request.medicalHistory(),
                request.profileImageUrl());

        return toResponse(pet);
    }

    @Transactional
    public void deletePet(Long petId) {

        Pet pet = findPet(petId);

        petRepository.delete(pet);
    }

    private Pet findPet(Long petId) {
        return petRepository.findById(petId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 반려동물입니다. petId=" + petId));
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