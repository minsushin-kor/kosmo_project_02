package com.petpulse.app.lostpet.service;

import com.petpulse.app.global.exception.BusinessException;
import com.petpulse.app.global.exception.ErrorCode;
import com.petpulse.app.lostpet.entity.PetLostQrProfile;
import com.petpulse.app.lostpet.repository.PetLostQrProfileRepository;
import com.petpulse.app.pet.entity.Pet;
import com.petpulse.app.pet.entity.PetGender;
import com.petpulse.app.pet.entity.PetSpecies;
import com.petpulse.app.pet.service.PetAccessService;
import com.petpulse.app.user.entity.User;
import com.petpulse.app.user.entity.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

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
    private PetAccessService petAccessService;
    private LostPetQrProfileService service;
    private Pet pet;

    @BeforeEach
    void setUp() {
        repository = mock(PetLostQrProfileRepository.class);
        petAccessService = mock(PetAccessService.class);
        service = new LostPetQrProfileService(repository, petAccessService);

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

        var response = service.createProfile("guardian", 1L);

        assertThat(response.publicToken()).hasSize(32);
        assertThat(response.active()).isTrue();
        assertThat(response.guardianName()).isEqualTo("김보호");
        assertThat(response.guardianPhone()).isEqualTo("010-1234-5678");
        assertThat(response.petName()).isEqualTo("초코");
        assertThat(response.species()).isEqualTo("DOG");
        assertThat(response.medicalHistory()).isEqualTo("땅콩 알레르기");
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

        assertThatThrownBy(() -> service.createProfile("guardian", 1L))
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
                "심장약 복용 중", null);

        var response = service.getPublicProfile("public-token");

        assertThat(response.guardianName()).isEqualTo("새보호자");
        assertThat(response.guardianPhone()).isEqualTo("010-9999-0000");
        assertThat(response.medicalHistory()).isEqualTo("심장약 복용 중");
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
    void rotatingTokenInvalidatesThePreviousUrlValue() {
        PetLostQrProfile profile = new PetLostQrProfile(pet, "old-token");
        when(repository.findByPetPetId(any())).thenReturn(Optional.of(profile));

        var response = service.rotateToken("guardian", 1L);

        assertThat(response.publicToken()).hasSize(32).isNotEqualTo("old-token");
    }
}
