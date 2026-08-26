package com.petpulse.app.lostpet.repository;

import com.petpulse.app.lostpet.entity.PetLostQrProfile;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PetLostQrProfileRepository extends JpaRepository<PetLostQrProfile, Long> {

    Optional<PetLostQrProfile> findByPetPetId(Long petId);

    @EntityGraph(attributePaths = {"pet", "pet.user"})
    Optional<PetLostQrProfile> findByPublicTokenAndActiveTrue(String publicToken);

    boolean existsByPublicToken(String publicToken);
}

