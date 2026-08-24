package com.petpulse.app.pet.service;

import com.petpulse.app.global.exception.BusinessException;
import com.petpulse.app.global.exception.ErrorCode;
import com.petpulse.app.pet.dto.PetRequest;
import com.petpulse.app.pet.entity.Pet;
import com.petpulse.app.pet.entity.PetGender;
import com.petpulse.app.pet.entity.PetSpecies;
import com.petpulse.app.pet.repository.PetRepository;
import com.petpulse.app.user.entity.User;
import com.petpulse.app.user.entity.UserRole;
import com.petpulse.app.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PetServiceTest {
    private PetRepository petRepository;
    private UserRepository userRepository;
    private PetService petService;
    private User owner;
    private Pet pet;

    @BeforeEach
    void setUp() throws Exception {
        petRepository = mock(PetRepository.class);
        userRepository = mock(UserRepository.class);
        petService = new PetService(petRepository, userRepository);
        owner = user(1L, "guardian");
        pet = pet(10L, owner, "초코");
        when(userRepository.findByLoginId("guardian")).thenReturn(Optional.of(owner));
    }

    @Test
    void authenticatedUserGetsOnlyOwnPets() {
        when(petRepository.findByUserUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(pet));

        var result = petService.getPets("guardian");

        assertEquals(1, result.size());
        assertEquals(1L, result.getFirst().userId());
        verify(petRepository).findByUserUserIdOrderByCreatedAtDesc(1L);
    }

    @Test
    void createAutomaticallyUsesAuthenticatedUserAsOwner() {
        when(petRepository.save(any(Pet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        petService.createPet("guardian", request("콩이"));

        ArgumentCaptor<Pet> captor = ArgumentCaptor.forClass(Pet.class);
        verify(petRepository).save(captor.capture());
        assertSame(owner, captor.getValue().getUser());
    }

    @Test
    void ownerCanGetPet() {
        when(petRepository.findByPetIdAndUserUserId(10L, 1L)).thenReturn(Optional.of(pet));
        assertEquals(10L, petService.getPet("guardian", 10L).petId());
    }

    @Test
    void ownerCanUpdatePetWithoutChangingOwner() {
        when(petRepository.findByPetIdAndUserUserId(10L, 1L)).thenReturn(Optional.of(pet));

        var result = petService.updatePet("guardian", 10L, request("새이름"));

        assertEquals("새이름", result.petName());
        assertSame(owner, pet.getUser());
    }

    @Test
    void ownerCanDeletePet() {
        when(petRepository.findByPetIdAndUserUserId(10L, 1L)).thenReturn(Optional.of(pet));
        petService.deletePet("guardian", 10L);
        verify(petRepository).delete(pet);
    }

    @Test
    void anotherUsersPetGetIsHiddenAsNotFound() {
        assertNotFound(() -> petService.getPet("guardian", 99L));
    }

    @Test
    void anotherUsersPetUpdateIsHiddenAsNotFound() {
        assertNotFound(() -> petService.updatePet("guardian", 99L, request("변경")));
        verify(petRepository, never()).save(any());
    }

    @Test
    void anotherUsersPetDeleteIsHiddenAsNotFound() {
        assertNotFound(() -> petService.deletePet("guardian", 99L));
        verify(petRepository, never()).delete(any());
    }

    private void assertNotFound(Runnable operation) {
        BusinessException exception = assertThrows(BusinessException.class, operation::run);
        assertEquals(ErrorCode.RESOURCE_NOT_FOUND, exception.getErrorCode());
        verify(petRepository).findByPetIdAndUserUserId(99L, 1L);
    }

    private PetRequest request(String name) {
        return new PetRequest(name, PetSpecies.DOG, "푸들", LocalDate.of(2023, 1, 1),
                PetGender.MALE, BigDecimal.valueOf(5.2), true, "", null);
    }

    private User user(Long id, String loginId) throws Exception {
        User user = new User(loginId, "$2a$encoded", loginId + "@example.com",
                "보호자", null, UserRole.USER);
        setField(user, "userId", id);
        return user;
    }

    private Pet pet(Long id, User user, String name) throws Exception {
        Pet pet = new Pet(user, name, PetSpecies.DOG, "푸들", LocalDate.of(2023, 1, 1),
                PetGender.MALE, BigDecimal.valueOf(5.2), true, "", null);
        setField(pet, "petId", id);
        return pet;
    }

    private void setField(Object target, String name, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(name);
        field.setAccessible(true);
        field.set(target, value);
    }
}
