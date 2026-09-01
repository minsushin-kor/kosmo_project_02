package com.petpulse.app.lostpet.service;

import com.petpulse.app.global.exception.BusinessException;
import com.petpulse.app.global.exception.ErrorCode;
import com.petpulse.app.lostpet.dto.CreateLostPetQrProfileRequest;
import com.petpulse.app.lostpet.dto.UpdateLostPetQrVisibilityRequest;
import com.petpulse.app.lostpet.entity.LostPetQrPhoto;
import com.petpulse.app.lostpet.entity.PetLostQrProfile;
import com.petpulse.app.lostpet.repository.LostPetQrPhotoRepository;
import com.petpulse.app.lostpet.repository.PetLostQrProfileRepository;
import com.petpulse.app.pet.entity.Pet;
import com.petpulse.app.pet.entity.PetGender;
import com.petpulse.app.pet.entity.PetSpecies;
import com.petpulse.app.pet.service.PetAccessService;
import com.petpulse.app.pet.service.PetProfileImageService;
import com.petpulse.app.user.entity.User;
import com.petpulse.app.user.entity.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LostPetQrProfileServiceTest {
    private PetLostQrProfileRepository repository;
    private LostPetQrPhotoRepository photoRepository;
    private PetAccessService petAccessService;
    private PetProfileImageService petProfileImageService;
    private LostPetQrProfileService service;
    private Pet pet;

    @BeforeEach
    void setUp() {
        repository = mock(PetLostQrProfileRepository.class);
        photoRepository = mock(LostPetQrPhotoRepository.class);
        petAccessService = mock(PetAccessService.class);
        petProfileImageService = mock(PetProfileImageService.class);
        service = new LostPetQrProfileService(
                repository, photoRepository, petAccessService, petProfileImageService);

        User guardian = new User(
                "guardian", "encoded", "guardian@example.com",
                "김보호", "010-1234-5678", UserRole.USER);
        pet = new Pet(
                guardian, "초코", PetSpecies.DOG, "푸들",
                LocalDate.of(2022, 1, 1), PetGender.MALE,
                BigDecimal.valueOf(4.5), true, "땅콩 알레르기", null);
        when(petAccessService.requireOwnedPet("guardian", 1L)).thenReturn(pet);
    }

    @Test
    void createsRandomTokenAndReturnsOnlyRequestedPublicFields() {
        when(repository.findByPetPetId(any())).thenReturn(Optional.empty());
        when(repository.save(any(PetLostQrProfile.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.createProfile(
                "guardian", 1L, new CreateLostPetQrProfileRequest(true, true, true));

        assertThat(response.publicToken()).hasSize(32);
        assertThat(response.active()).isTrue();
        assertThat(response.guardianName()).isEqualTo("김보호");
        assertThat(response.guardianPhone()).isEqualTo("010-1234-5678");
        assertThat(response.petName()).isEqualTo("초코");
        assertThat(response.species()).isEqualTo("DOG");
        assertThat(response.breed()).isEqualTo("푸들");
        assertThat(response.medicalHistory()).isEqualTo("땅콩 알레르기");
        assertThat(response.showGuardianName()).isTrue();
        assertThat(response.showPetDetails()).isTrue();
        assertThat(response.showMedicalHistory()).isTrue();
        verify(repository).save(any(PetLostQrProfile.class));
    }

    @Test
    void refusesCreationWhenGuardianPhoneIsMissing() {
        User guardian = new User(
                "guardian", "encoded", "guardian@example.com",
                "김보호", " ", UserRole.USER);
        Pet petWithoutPhone = new Pet(
                guardian, "초코", PetSpecies.DOG, "푸들",
                LocalDate.of(2022, 1, 1), PetGender.MALE,
                BigDecimal.valueOf(4.5), true, "", null);
        when(petAccessService.requireOwnedPet("guardian", 1L)).thenReturn(petWithoutPhone);

        assertThatThrownBy(() -> service.createProfile(
                "guardian", 1L, new CreateLostPetQrProfileRequest(true, true, true)))
                .isInstanceOf(BusinessException.class)
                .extracting(exception -> ((BusinessException) exception).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_REQUEST);
    }

    @Test
    void publicLookupReadsLatestUserAndPetData() {
        PetLostQrProfile profile = new PetLostQrProfile(pet, "public-token");
        when(repository.findByPublicTokenAndActiveTrue("public-token"))
                .thenReturn(Optional.of(profile));

        pet.getUser().updateProfile("새보호자", "guardian@example.com", "010-9999-0000");
        pet.update(
                "초코", PetSpecies.DOG, "푸들", LocalDate.of(2022, 1, 1),
                PetGender.MALE, BigDecimal.valueOf(4.5), true,
                "심장약 복용 중", "/api/pets/1/profile-image?v=1");

        var response = service.getPublicProfile("public-token");

        assertThat(response.guardianName()).isEqualTo("새보호자");
        assertThat(response.guardianPhone()).isEqualTo("010-9999-0000");
        assertThat(response.breed()).isEqualTo("푸들");
        assertThat(response.medicalHistory()).isEqualTo("심장약 복용 중");
        assertThat(response.photoUrl()).isEqualTo("/api/pets/1/profile-image?v=1");
    }

    @Test
    void savesLatestPhotoForPublicQrProfile() {
        PetLostQrProfile profile = new PetLostQrProfile(pet, "public-token");
        ReflectionTestUtils.setField(pet, "petId", 1L);
        ReflectionTestUtils.setField(profile, "profileId", 10L);
        when(repository.findByPetPetId(1L)).thenReturn(Optional.of(profile));
        when(photoRepository.findById(10L)).thenReturn(Optional.empty());
        when(photoRepository.save(any(LostPetQrPhoto.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        var image = new MockMultipartFile(
                "image", "latest.png", "image/png",
                new byte[] {(byte) 0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0});

        var response = service.savePhoto("guardian", 1L, image);

        assertThat(response.customPhoto()).isTrue();
        assertThat(response.photoUrl())
                .startsWith("/api/pets/1/lost-qr-profile/photo?v=");
        verify(photoRepository).save(any(LostPetQrPhoto.class));
    }

    @Test
    void publicLookupOmitsInformationDisabledByGuardian() {
        PetLostQrProfile profile = new PetLostQrProfile(
                pet, "public-token", false, false, false);
        when(repository.findByPublicTokenAndActiveTrue("public-token"))
                .thenReturn(Optional.of(profile));

        var response = service.getPublicProfile("public-token");

        assertThat(response.guardianName()).isNull();
        assertThat(response.guardianPhone()).isEqualTo("010-1234-5678");
        assertThat(response.petName()).isEqualTo("초코");
        assertThat(response.species()).isNull();
        assertThat(response.breed()).isNull();
        assertThat(response.medicalHistory()).isNull();
    }

    @Test
    void updatesOnlyVisibilityWithoutRotatingTokenOrChangingSourceData() {
        PetLostQrProfile profile = new PetLostQrProfile(pet, "public-token");
        when(repository.findByPetPetId(any())).thenReturn(Optional.of(profile));

        var response = service.updateVisibility(
                "guardian",
                1L,
                new UpdateLostPetQrVisibilityRequest(
                        false,
                        true,
                        false));

        assertThat(response.publicToken()).isEqualTo("public-token");
        assertThat(response.guardianName()).isEqualTo("김보호");
        assertThat(response.petName()).isEqualTo("초코");
        assertThat(response.species()).isEqualTo("DOG");
        assertThat(response.breed()).isEqualTo("푸들");
        assertThat(response.showGuardianName()).isFalse();
        assertThat(response.showPetDetails()).isTrue();
        assertThat(response.showMedicalHistory()).isFalse();
    }

    @Test
    void publicLookupIsHiddenAfterGuardianRemovesPhone() {
        PetLostQrProfile profile = new PetLostQrProfile(pet, "public-token");
        when(repository.findByPublicTokenAndActiveTrue("public-token"))
                .thenReturn(Optional.of(profile));
        pet.getUser().updateProfile("김보호", "guardian@example.com", " ");

        assertThatThrownBy(() -> service.getPublicProfile("public-token"))
                .isInstanceOf(BusinessException.class)
                .extracting(exception -> ((BusinessException) exception).getErrorCode())
                .isEqualTo(ErrorCode.RESOURCE_NOT_FOUND);
    }

    @Test
    void deletesOwnedQrProfileSoThePreviousUrlStopsWorking() {
        PetLostQrProfile profile = new PetLostQrProfile(pet, "public-token");
        when(repository.findByPetPetId(any())).thenReturn(Optional.of(profile));

        service.deleteProfile("guardian", 1L);

        verify(repository).delete(profile);
    }
}
