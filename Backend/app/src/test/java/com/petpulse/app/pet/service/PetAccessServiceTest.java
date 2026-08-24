package com.petpulse.app.pet.service;

import com.petpulse.app.global.exception.BusinessException;
import com.petpulse.app.global.exception.ErrorCode;
import com.petpulse.app.pet.entity.Pet;
import com.petpulse.app.pet.repository.PetRepository;
import com.petpulse.app.user.entity.User;
import com.petpulse.app.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PetAccessServiceTest {
    @Mock UserRepository userRepository;
    @Mock PetRepository petRepository;
    @Mock User user;
    @Mock Pet pet;

    @Test
    void returnsOnlyPetOwnedByAuthenticatedUser() {
        when(userRepository.findByLoginId("owner")).thenReturn(Optional.of(user));
        when(user.getUserId()).thenReturn(10L);
        when(petRepository.findByPetIdAndUserUserId(1L, 10L)).thenReturn(Optional.of(pet));

        assertThat(new PetAccessService(userRepository, petRepository)
                .requireOwnedPet("owner", 1L)).isSameAs(pet);
    }

    @Test
    void hidesForeignPetAsNotFound() {
        when(userRepository.findByLoginId("other")).thenReturn(Optional.of(user));
        when(user.getUserId()).thenReturn(20L);
        when(petRepository.findByPetIdAndUserUserId(1L, 20L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> new PetAccessService(userRepository, petRepository)
                .requireOwnedPet("other", 1L))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.RESOURCE_NOT_FOUND));
    }
}
