package com.petpulse.app.pet.repository;

import com.petpulse.app.pet.entity.Pet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PetRepository extends JpaRepository<Pet, Long> {

    List<Pet> findByUserUserIdOrderByCreatedAtDesc(Long userId);
}