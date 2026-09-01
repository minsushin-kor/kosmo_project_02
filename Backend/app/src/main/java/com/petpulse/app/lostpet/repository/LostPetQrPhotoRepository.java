package com.petpulse.app.lostpet.repository;

import com.petpulse.app.lostpet.entity.LostPetQrPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LostPetQrPhotoRepository extends JpaRepository<LostPetQrPhoto, Long> {
}
