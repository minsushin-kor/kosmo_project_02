package com.petpulse.app.diary.service;

import com.petpulse.app.diary.dto.HealthDiaryEntryRequest;
import com.petpulse.app.diary.dto.HealthDiaryEntryResponse;
import com.petpulse.app.diary.entity.GuardianStatus;
import com.petpulse.app.pet.entity.Pet;
import com.petpulse.app.pet.entity.PetGender;
import com.petpulse.app.pet.entity.PetSpecies;
import com.petpulse.app.pet.repository.PetRepository;
import com.petpulse.app.user.entity.User;
import com.petpulse.app.user.entity.UserRole;
import com.petpulse.app.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Constructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class HealthDiaryTimestampIntegrationTest {

    @Autowired
    private HealthDiaryService healthDiaryService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PetRepository petRepository;

    @Test
    void updateResponseTimestampMatchesSubsequentMonthlyGet() throws Exception {
        Pet pet = createPet();
        LocalDate recordDate = LocalDate.now().minusDays(1);

        HealthDiaryEntryResponse created = healthDiaryService.upsertEntry(
                pet.getPetId(),
                recordDate,
                new HealthDiaryEntryRequest(GuardianStatus.GOOD, "최초 기록"));

        Thread.sleep(10);

        HealthDiaryEntryResponse updated = healthDiaryService.upsertEntry(
                pet.getPetId(),
                recordDate,
                new HealthDiaryEntryRequest(GuardianStatus.WATCH, "수정 기록"));

        HealthDiaryEntryResponse fetched = healthDiaryService.getMonthlyEntries(
                        pet.getPetId(),
                        recordDate.getYear(),
                        recordDate.getMonthValue())
                .stream()
                .filter(entry -> entry.date().equals(recordDate))
                .findFirst()
                .orElseThrow();

        assertThat(created.createdAt()).isNotNull();
        assertThat(created.updatedAt()).isNotNull();
        assertThat(updated.updatedAt()).isAfter(created.updatedAt());
        assertThat(updated.updatedAt()).isEqualTo(fetched.updatedAt());
        assertThat(updated.createdAt()).isEqualTo(fetched.createdAt());
    }

    private Pet createPet() throws Exception {
        String suffix = UUID.randomUUID().toString();
        User user = newUser(suffix);
        User savedUser = userRepository.saveAndFlush(user);

        Pet pet = new Pet(
                savedUser,
                "타임스탬프 테스트",
                PetSpecies.DOG,
                "푸들",
                LocalDate.of(2022, 1, 1),
                PetGender.MALE,
                BigDecimal.valueOf(5.5),
                true,
                "",
                null);

        return petRepository.saveAndFlush(pet);
    }

    private User newUser(String suffix) throws Exception {
        Constructor<User> constructor = User.class.getDeclaredConstructor();
        constructor.setAccessible(true);
        User user = constructor.newInstance();

        ReflectionTestUtils.setField(user, "loginId", "diary-" + suffix);
        ReflectionTestUtils.setField(user, "password", "test-password");
        ReflectionTestUtils.setField(user, "email", suffix + "@example.com");
        ReflectionTestUtils.setField(user, "userName", "다이어리 테스트");
        ReflectionTestUtils.setField(user, "role", UserRole.USER);

        return user;
    }
}
