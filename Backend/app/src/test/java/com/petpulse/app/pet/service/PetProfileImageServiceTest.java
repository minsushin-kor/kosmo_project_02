package com.petpulse.app.pet.service;

import com.petpulse.app.global.exception.BusinessException;
import com.petpulse.app.global.exception.ErrorCode;
import com.petpulse.app.pet.entity.Pet;
import com.petpulse.app.pet.entity.PetGender;
import com.petpulse.app.pet.entity.PetProfileImage;
import com.petpulse.app.pet.entity.PetSpecies;
import com.petpulse.app.pet.repository.PetProfileImageRepository;
import com.petpulse.app.user.entity.User;
import com.petpulse.app.user.entity.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockMultipartFile;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PetProfileImageServiceTest {
    private PetAccessService petAccessService;
    private PetProfileImageRepository imageRepository;
    private PetProfileImageService imageService;
    private Pet pet;

    @BeforeEach
    void setUp() throws Exception {
        petAccessService = mock(PetAccessService.class);
        imageRepository = mock(PetProfileImageRepository.class);
        imageService = new PetProfileImageService(petAccessService, imageRepository);

        User owner = new User("guardian", "$2a$encoded", "guardian@example.com",
                "보호자", null, UserRole.USER);
        setField(owner, "userId", 1L);
        pet = new Pet(owner, "초코", PetSpecies.DOG, "푸들", LocalDate.of(2023, 1, 1),
                PetGender.MALE, BigDecimal.valueOf(5.2), true, "", null);
        setField(pet, "petId", 10L);
        when(petAccessService.requireOwnedPet("guardian", 10L)).thenReturn(pet);
    }

    @Test
    void ownerCanSaveValidatedPngAndPetGetsImageUrl() {
        byte[] png = {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};
        MockMultipartFile file = new MockMultipartFile(
                "image", "choco.png", "image/png", png);
        when(imageRepository.findById(10L)).thenReturn(Optional.empty());

        imageService.save("guardian", 10L, file);

        ArgumentCaptor<PetProfileImage> captor = ArgumentCaptor.forClass(PetProfileImage.class);
        verify(imageRepository).save(captor.capture());
        assertArrayEquals(png, captor.getValue().getImageData());
        assertEquals("image/png", captor.getValue().getContentType());
        assertTrue(pet.getProfileImageUrl().startsWith("/api/pets/10/profile-image?v="));
    }

    @Test
    void fileExtensionCannotDisguiseInvalidImageBytes() {
        MockMultipartFile file = new MockMultipartFile(
                "image", "not-an-image.png", "image/png", "plain text".getBytes());

        BusinessException exception = assertThrows(BusinessException.class,
                () -> imageService.save("guardian", 10L, file));

        assertEquals(ErrorCode.INVALID_REQUEST, exception.getErrorCode());
        verifyNoInteractions(petAccessService, imageRepository);
    }

    @Test
    void unsupportedContentTypeIsRejected() {
        MockMultipartFile file = new MockMultipartFile(
                "image", "choco.gif", "image/gif", new byte[] {'G', 'I', 'F'});

        BusinessException exception = assertThrows(BusinessException.class,
                () -> imageService.save("guardian", 10L, file));

        assertEquals(ErrorCode.INVALID_REQUEST, exception.getErrorCode());
        verifyNoInteractions(petAccessService, imageRepository);
    }

    @Test
    void imageLargerThanFiveMegabytesIsRejected() {
        byte[] oversizedPng = new byte[5 * 1024 * 1024 + 1];
        oversizedPng[0] = (byte) 0x89;
        oversizedPng[1] = 0x50;
        oversizedPng[2] = 0x4e;
        oversizedPng[3] = 0x47;
        MockMultipartFile file = new MockMultipartFile(
                "image", "too-large.png", "image/png", oversizedPng);

        BusinessException exception = assertThrows(BusinessException.class,
                () -> imageService.save("guardian", 10L, file));

        assertEquals(ErrorCode.INVALID_REQUEST, exception.getErrorCode());
        verifyNoInteractions(petAccessService, imageRepository);
    }

    @Test
    void deletingImageRequiresOwnershipAndClearsPetUrl() {
        pet.updateProfileImageUrl("/api/pets/10/profile-image?v=1");

        imageService.delete("guardian", 10L);

        verify(petAccessService).requireOwnedPet("guardian", 10L);
        verify(imageRepository).deleteById(10L);
        assertNull(pet.getProfileImageUrl());
    }

    private void setField(Object target, String name, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(name);
        field.setAccessible(true);
        field.set(target, value);
    }
}
