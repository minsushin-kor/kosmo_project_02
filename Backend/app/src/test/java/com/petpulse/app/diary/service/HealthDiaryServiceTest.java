package com.petpulse.app.diary.service;

import com.petpulse.app.diary.dto.HealthDiaryEntryRequest;
import com.petpulse.app.diary.entity.GuardianStatus;
import com.petpulse.app.diary.entity.HealthDiaryEntry;
import com.petpulse.app.diary.repository.HealthDiaryEntryRepository;
import com.petpulse.app.global.exception.BusinessException;
import com.petpulse.app.global.exception.ErrorCode;
import com.petpulse.app.pet.entity.Pet;
import com.petpulse.app.pet.repository.PetRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HealthDiaryServiceTest {

    @Mock
    private HealthDiaryEntryRepository healthDiaryEntryRepository;

    @Mock
    private PetRepository petRepository;

    private HealthDiaryService healthDiaryService;
    @Mock
    private Pet pet;

    @BeforeEach
    void setUp() {
        healthDiaryService = new HealthDiaryService(
                healthDiaryEntryRepository,
                petRepository);
    }

    @Test
    void monthlyEntriesIncludeFirstAndLastDay() {
        LocalDate firstDay = LocalDate.of(2026, 8, 1);
        LocalDate lastDay = LocalDate.of(2026, 8, 31);
        HealthDiaryEntry firstEntry = new HealthDiaryEntry(
                pet, firstDay, GuardianStatus.GOOD, "월 시작");
        HealthDiaryEntry lastEntry = new HealthDiaryEntry(
                pet, lastDay, GuardianStatus.WATCH, "월 마지막");

        when(pet.getPetId()).thenReturn(1L);
        when(petRepository.findById(1L)).thenReturn(Optional.of(pet));
        when(healthDiaryEntryRepository
                .findByPetPetIdAndRecordDateBetweenOrderByRecordDateAsc(
                        1L,
                        firstDay,
                        lastDay))
                .thenReturn(List.of(firstEntry, lastEntry));

        assertThat(healthDiaryService.getMonthlyEntries(1L, 2026, 8))
                .extracting(response -> response.date())
                .containsExactly(firstDay, lastDay);

        verify(healthDiaryEntryRepository)
                .findByPetPetIdAndRecordDateBetweenOrderByRecordDateAsc(
                        1L,
                        firstDay,
                        lastDay);
    }

    @Test
    void monthlyEntriesReturnEmptyListWhenMonthHasNoRecords() {
        when(petRepository.findById(1L)).thenReturn(Optional.of(pet));
        when(healthDiaryEntryRepository
                .findByPetPetIdAndRecordDateBetweenOrderByRecordDateAsc(
                        1L,
                        LocalDate.of(2026, 9, 1),
                        LocalDate.of(2026, 9, 30)))
                .thenReturn(List.of());

        assertThat(healthDiaryService.getMonthlyEntries(1L, 2026, 9))
                .isEmpty();
    }

    @Test
    void repeatedUpsertForSamePetAndDateUpdatesSingleStoredEntry() {
        LocalDate date = LocalDate.now();
        AtomicReference<HealthDiaryEntry> storedEntry = new AtomicReference<>();

        when(pet.getPetId()).thenReturn(1L);
        when(petRepository.findById(1L)).thenReturn(Optional.of(pet));
        when(healthDiaryEntryRepository.findByPetPetIdAndRecordDate(1L, date))
                .thenAnswer(invocation -> Optional.ofNullable(storedEntry.get()));
        when(healthDiaryEntryRepository.save(any(HealthDiaryEntry.class)))
                .thenAnswer(invocation -> {
                    HealthDiaryEntry entry = invocation.getArgument(0);
                    storedEntry.set(entry);
                    return entry;
                });

        healthDiaryService.upsertEntry(
                1L,
                date,
                new HealthDiaryEntryRequest(GuardianStatus.GOOD, "첫 메모"));
        HealthDiaryEntry firstStoredEntry = storedEntry.get();

        healthDiaryService.upsertEntry(
                1L,
                date,
                new HealthDiaryEntryRequest(GuardianStatus.WATCH, "수정 메모"));

        assertThat(storedEntry.get()).isSameAs(firstStoredEntry);
        assertThat(storedEntry.get().getGuardianStatus()).isEqualTo(GuardianStatus.WATCH);
        assertThat(storedEntry.get().getNote()).isEqualTo("수정 메모");
        verify(healthDiaryEntryRepository, times(2))
                .findByPetPetIdAndRecordDate(1L, date);
        verify(healthDiaryEntryRepository, times(2)).save(firstStoredEntry);
    }

    @Test
    void sameDateEntriesAreSeparatedByPetId() {
        LocalDate date = LocalDate.now();
        Pet otherPet = mock(Pet.class);

        when(pet.getPetId()).thenReturn(1L);
        when(otherPet.getPetId()).thenReturn(2L);
        when(petRepository.findById(1L)).thenReturn(Optional.of(pet));
        when(petRepository.findById(2L)).thenReturn(Optional.of(otherPet));
        when(healthDiaryEntryRepository.findByPetPetIdAndRecordDate(1L, date))
                .thenReturn(Optional.empty());
        when(healthDiaryEntryRepository.findByPetPetIdAndRecordDate(2L, date))
                .thenReturn(Optional.empty());
        when(healthDiaryEntryRepository.save(any(HealthDiaryEntry.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        healthDiaryService.upsertEntry(
                1L, date, new HealthDiaryEntryRequest(GuardianStatus.GOOD, "초코"));
        healthDiaryService.upsertEntry(
                2L, date, new HealthDiaryEntryRequest(GuardianStatus.WATCH, "보리"));

        var entryCaptor = org.mockito.ArgumentCaptor.forClass(HealthDiaryEntry.class);
        verify(healthDiaryEntryRepository, times(2)).save(entryCaptor.capture());
        assertThat(entryCaptor.getAllValues())
                .extracting(entry -> entry.getPet().getPetId())
                .containsExactly(1L, 2L);
        assertThat(entryCaptor.getAllValues())
                .extracting(HealthDiaryEntry::getRecordDate)
                .containsOnly(date);
    }

    @Test
    void upsertUpdatesExistingEntryAndNormalizesNullNote() {
        LocalDate date = LocalDate.now();
        HealthDiaryEntry existing = new HealthDiaryEntry(
                pet,
                date,
                GuardianStatus.GOOD,
                "기존 메모");

        when(petRepository.findById(1L)).thenReturn(Optional.of(pet));
        when(healthDiaryEntryRepository.findByPetPetIdAndRecordDate(1L, date))
                .thenReturn(Optional.of(existing));
        when(healthDiaryEntryRepository.save(existing)).thenReturn(existing);

        healthDiaryService.upsertEntry(
                1L,
                date,
                new HealthDiaryEntryRequest(GuardianStatus.WATCH, null));

        assertThat(existing.getGuardianStatus()).isEqualTo(GuardianStatus.WATCH);
        assertThat(existing.getNote()).isEmpty();
        verify(healthDiaryEntryRepository).save(existing);
    }

    @Test
    void deleteRemovesOnlyMatchingDiaryEntry() {
        LocalDate date = LocalDate.now();
        HealthDiaryEntry entry = new HealthDiaryEntry(
                pet,
                date,
                GuardianStatus.GOOD,
                "삭제 대상");

        when(petRepository.findById(1L)).thenReturn(Optional.of(pet));
        when(healthDiaryEntryRepository.findByPetPetIdAndRecordDate(1L, date))
                .thenReturn(Optional.of(entry));

        healthDiaryService.deleteEntry(1L, date);

        verify(healthDiaryEntryRepository).delete(entry);
        verifyNoMoreInteractions(healthDiaryEntryRepository);
        verify(petRepository).findById(1L);
        verifyNoMoreInteractions(petRepository);
    }

    @Test
    void futureDateIsRejected() {
        when(petRepository.findById(1L)).thenReturn(Optional.of(pet));

        assertThatThrownBy(() -> healthDiaryService.upsertEntry(
                1L,
                LocalDate.now().plusDays(1),
                new HealthDiaryEntryRequest(GuardianStatus.GOOD, "")))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getErrorCode())
                                .isEqualTo(ErrorCode.INVALID_REQUEST));

        verifyNoInteractions(healthDiaryEntryRepository);
    }

    @Test
    void invalidMonthIsRejected() {
        when(petRepository.findById(1L)).thenReturn(Optional.of(pet));

        assertThatThrownBy(() -> healthDiaryService.getMonthlyEntries(1L, 2026, 13))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getErrorCode())
                                .isEqualTo(ErrorCode.INVALID_REQUEST));

        verifyNoInteractions(healthDiaryEntryRepository);
    }

    @Test
    void missingPetIsRejectedBeforeDiaryLookup() {
        when(petRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> healthDiaryService.getMonthlyEntries(99L, 2026, 8))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getErrorCode())
                                .isEqualTo(ErrorCode.RESOURCE_NOT_FOUND));

        verifyNoInteractions(healthDiaryEntryRepository);
    }
}
