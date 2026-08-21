package com.petpulse.app.diary.service;

import com.petpulse.app.diary.dto.HealthDiaryEntryRequest;
import com.petpulse.app.diary.dto.HealthDiaryEntryResponse;
import com.petpulse.app.diary.entity.HealthDiaryEntry;
import com.petpulse.app.diary.repository.HealthDiaryEntryRepository;
import com.petpulse.app.global.exception.BusinessException;
import com.petpulse.app.global.exception.ErrorCode;
import com.petpulse.app.pet.entity.Pet;
import com.petpulse.app.pet.repository.PetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HealthDiaryService {

    private final HealthDiaryEntryRepository healthDiaryEntryRepository;
    private final PetRepository petRepository;

    public List<HealthDiaryEntryResponse> getMonthlyEntries(
            Long petId,
            int year,
            int month) {
        requirePet(petId);
        YearMonth yearMonth = requireYearMonth(year, month);

        return healthDiaryEntryRepository
                .findByPetPetIdAndRecordDateBetweenOrderByRecordDateAsc(
                        petId,
                        yearMonth.atDay(1),
                        yearMonth.atEndOfMonth())
                .stream()
                .map(HealthDiaryEntryResponse::from)
                .toList();
    }

    @Transactional
    public HealthDiaryEntryResponse upsertEntry(
            Long petId,
            LocalDate date,
            HealthDiaryEntryRequest request) {
        Pet pet = requirePet(petId);
        requireNotFuture(date);
        String note = request.note() == null ? "" : request.note();

        HealthDiaryEntry entry = healthDiaryEntryRepository
                .findByPetPetIdAndRecordDate(petId, date)
                .map(existing -> {
                    existing.update(request.status(), note);
                    return existing;
                })
                .orElseGet(() -> new HealthDiaryEntry(
                        pet,
                        date,
                        request.status(),
                        note));

        return HealthDiaryEntryResponse.from(
                healthDiaryEntryRepository.save(entry));
    }

    @Transactional
    public void deleteEntry(Long petId, LocalDate date) {
        requirePet(petId);
        healthDiaryEntryRepository
                .findByPetPetIdAndRecordDate(petId, date)
                .ifPresent(healthDiaryEntryRepository::delete);
    }

    private Pet requirePet(Long petId) {
        return petRepository.findById(petId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        "존재하지 않는 반려동물입니다. petId=" + petId));
    }

    private YearMonth requireYearMonth(int year, int month) {
        if (year < 1 || year > 9999 || month < 1 || month > 12) {
            throw new BusinessException(
                    ErrorCode.INVALID_REQUEST,
                    "유효하지 않은 연월입니다. year=" + year + ", month=" + month);
        }

        try {
            return YearMonth.of(year, month);
        } catch (DateTimeException exception) {
            throw new BusinessException(
                    ErrorCode.INVALID_REQUEST,
                    "유효하지 않은 연월입니다. year=" + year + ", month=" + month);
        }
    }

    private void requireNotFuture(LocalDate date) {
        if (date.isAfter(LocalDate.now())) {
            throw new BusinessException(
                    ErrorCode.INVALID_REQUEST,
                    "미래 날짜에는 다이어리를 작성할 수 없습니다. date=" + date);
        }
    }
}
