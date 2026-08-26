package com.petpulse.app.pet.repository;

import com.petpulse.app.pet.entity.PetProfileImage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PetProfileImageRepository extends JpaRepository<PetProfileImage, Long> {
}
