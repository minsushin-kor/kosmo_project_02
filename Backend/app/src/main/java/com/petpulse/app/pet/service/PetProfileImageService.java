package com.petpulse.app.pet.service;

import com.petpulse.app.global.exception.BusinessException;
import com.petpulse.app.global.exception.ErrorCode;
import com.petpulse.app.pet.dto.PetProfileImageContent;
import com.petpulse.app.pet.entity.Pet;
import com.petpulse.app.pet.entity.PetProfileImage;
import com.petpulse.app.pet.repository.PetProfileImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.ZoneOffset;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PetProfileImageService {
    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp");

    private final PetAccessService petAccessService;
    private final PetProfileImageRepository imageRepository;

    @Transactional
    public void save(String loginId, Long petId, MultipartFile file) {
        byte[] imageData = validateAndRead(file);
        Pet pet = petAccessService.requireOwnedPet(loginId, petId);
        String fileName = sanitizeFileName(file.getOriginalFilename());
        PetProfileImage image = imageRepository.findById(petId)
                .orElseGet(() -> new PetProfileImage(
                        pet, file.getContentType(), fileName, imageData));

        if (image.getPetId() != null) {
            image.update(file.getContentType(), fileName, imageData);
        }

        imageRepository.save(image);
        pet.updateProfileImageUrl(buildImageUrl(petId));
    }

    public PetProfileImageContent get(Long petId) {
        PetProfileImage image = imageRepository.findById(petId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.RESOURCE_NOT_FOUND, "반려동물 프로필 사진을 찾을 수 없습니다."));
        long updatedAt = image.getUpdatedAt() == null
                ? 0
                : image.getUpdatedAt().toInstant(ZoneOffset.UTC).toEpochMilli();
        return new PetProfileImageContent(
                image.getImageData(), image.getContentType(), image.getOriginalFileName(), updatedAt);
    }

    @Transactional
    public void delete(String loginId, Long petId) {
        Pet pet = petAccessService.requireOwnedPet(loginId, petId);
        imageRepository.deleteById(petId);
        pet.updateProfileImageUrl(null);
    }

    private byte[] validateAndRead(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw invalidImage("업로드할 프로필 사진을 선택해 주세요.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw invalidImage("프로필 사진은 5MB 이하만 업로드할 수 있습니다.");
        }
        if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            throw invalidImage("JPG, PNG, WEBP 형식의 이미지만 업로드할 수 있습니다.");
        }

        try {
            byte[] data = file.getBytes();
            if (!hasValidSignature(file.getContentType(), data)) {
                throw invalidImage("이미지 파일의 형식이 올바르지 않습니다.");
            }
            return data;
        } catch (IOException exception) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST,
                    "프로필 사진을 읽지 못했습니다.");
        }
    }

    private boolean hasValidSignature(String contentType, byte[] data) {
        return switch (contentType) {
            case "image/jpeg" -> data.length >= 3
                    && (data[0] & 0xff) == 0xff && (data[1] & 0xff) == 0xd8
                    && (data[2] & 0xff) == 0xff;
            case "image/png" -> data.length >= 8
                    && (data[0] & 0xff) == 0x89 && data[1] == 0x50
                    && data[2] == 0x4e && data[3] == 0x47;
            case "image/webp" -> data.length >= 12
                    && data[0] == 'R' && data[1] == 'I' && data[2] == 'F' && data[3] == 'F'
                    && data[8] == 'W' && data[9] == 'E' && data[10] == 'B' && data[11] == 'P';
            default -> false;
        };
    }

    private String sanitizeFileName(String originalFileName) {
        if (!StringUtils.hasText(originalFileName)) return null;
        String cleanName = StringUtils.cleanPath(originalFileName);
        return cleanName.length() <= 255 ? cleanName : cleanName.substring(cleanName.length() - 255);
    }

    private String buildImageUrl(Long petId) {
        return "/api/pets/" + petId + "/profile-image?v=" + System.currentTimeMillis();
    }

    private BusinessException invalidImage(String message) {
        return new BusinessException(ErrorCode.INVALID_REQUEST, message);
    }
}
