package com.petpulse.app.lostpet.service;

import com.petpulse.app.global.exception.BusinessException;
import com.petpulse.app.global.exception.ErrorCode;
import com.petpulse.app.lostpet.dto.CreateLostPetQrProfileRequest;
import com.petpulse.app.lostpet.dto.LostPetQrPhotoContent;
import com.petpulse.app.lostpet.dto.LostPetQrProfileResponse;
import com.petpulse.app.lostpet.dto.PublicLostPetProfileResponse;
import com.petpulse.app.lostpet.dto.UpdateLostPetQrVisibilityRequest;
import com.petpulse.app.lostpet.entity.LostPetQrPhoto;
import com.petpulse.app.lostpet.entity.PetLostQrProfile;
import com.petpulse.app.lostpet.repository.LostPetQrPhotoRepository;
import com.petpulse.app.lostpet.repository.PetLostQrProfileRepository;
import com.petpulse.app.pet.entity.Pet;
import com.petpulse.app.pet.dto.PetProfileImageContent;
import com.petpulse.app.pet.service.PetAccessService;
import com.petpulse.app.pet.service.PetProfileImageService;
import com.petpulse.app.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.SecureRandom;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LostPetQrProfileService {
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int TOKEN_BYTES = 24;
    private static final long MAX_PHOTO_SIZE = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_PHOTO_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp");

    private final PetLostQrProfileRepository profileRepository;
    private final LostPetQrPhotoRepository photoRepository;
    private final PetAccessService petAccessService;
    private final PetProfileImageService petProfileImageService;

    public LostPetQrProfileResponse getProfile(String loginId, Long petId) {
        Pet pet = petAccessService.requireOwnedPet(loginId, petId);
        PetLostQrProfile profile = profileRepository.findByPetPetId(pet.getPetId())
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        "아직 생성된 실종 대비 QR이 없습니다."));
        return toOwnerResponse(profile);
    }

    @Transactional
    public LostPetQrProfileResponse createProfile(
            String loginId,
            Long petId,
            CreateLostPetQrProfileRequest request) {
        Pet pet = petAccessService.requireOwnedPet(loginId, petId);
        validatePhone(pet.getUser());

        return profileRepository.findByPetPetId(pet.getPetId())
                .map(profile -> {
                    profile.updateVisibility(
                            request.showGuardianName(),
                            request.showPetDetails(),
                            request.showMedicalHistory());
                    return toOwnerResponse(profile);
                })
                .orElseGet(() -> {
                    PetLostQrProfile saved = profileRepository.save(
                            new PetLostQrProfile(
                                    pet,
                                    generateUniqueToken(),
                                    request.showGuardianName(),
                                    request.showPetDetails(),
                                    request.showMedicalHistory()));
                    return toOwnerResponse(saved);
                });
    }

    @Transactional
    public LostPetQrProfileResponse updateVisibility(
            String loginId,
            Long petId,
            UpdateLostPetQrVisibilityRequest request) {
        PetLostQrProfile profile = requireOwnedProfile(loginId, petId);
        profile.updateVisibility(
                request.showGuardianName(),
                request.showPetDetails(),
                request.showMedicalHistory());
        return toOwnerResponse(profile);
    }

    @Transactional
    public LostPetQrProfileResponse updateActive(
            String loginId,
            Long petId,
            boolean active) {
        PetLostQrProfile profile = requireOwnedProfile(loginId, petId);
        if (active) {
            validatePhone(profile.getPet().getUser());
        }
        profile.updateActive(active);
        return toOwnerResponse(profile);
    }

    @Transactional
    public void deleteProfile(String loginId, Long petId) {
        PetLostQrProfile profile = requireOwnedProfile(loginId, petId);
        profileRepository.delete(profile);
    }

    @Transactional
    public LostPetQrProfileResponse savePhoto(
            String loginId,
            Long petId,
            MultipartFile file) {
        PetLostQrProfile profile = requireOwnedProfile(loginId, petId);
        byte[] imageData = validateAndReadPhoto(file);
        String fileName = sanitizeFileName(file.getOriginalFilename());
        LostPetQrPhoto photo = photoRepository.findById(profile.getProfileId())
                .orElseGet(() -> new LostPetQrPhoto(
                        profile, file.getContentType(), fileName, imageData));

        if (photo.getProfileId() != null) {
            photo.update(file.getContentType(), fileName, imageData);
        }

        photoRepository.save(photo);
        return toOwnerResponse(profile, new PhotoDetails(
                buildOwnerPhotoUrl(profile, System.currentTimeMillis()), true));
    }

    @Transactional
    public LostPetQrProfileResponse deletePhoto(String loginId, Long petId) {
        PetLostQrProfile profile = requireOwnedProfile(loginId, petId);
        photoRepository.findById(profile.getProfileId()).ifPresent(photoRepository::delete);
        return toOwnerResponse(profile, getProfilePhotoFallback(profile.getPet()));
    }

    public LostPetQrPhotoContent getPublicPhoto(String publicToken) {
        PetLostQrProfile profile = profileRepository
                .findByPublicTokenAndActiveTrue(publicToken)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        "유효한 실종 대비 프로필을 찾을 수 없습니다."));
        return getPreferredPhoto(profile);
    }

    public LostPetQrPhotoContent getOwnedPhoto(String loginId, Long petId) {
        PetLostQrProfile profile = requireOwnedProfile(loginId, petId);
        return getPreferredPhoto(profile);
    }

    private LostPetQrPhotoContent getPreferredPhoto(PetLostQrProfile profile) {
        var customPhoto = photoRepository.findById(profile.getProfileId());
        if (customPhoto.isPresent()) {
            LostPetQrPhoto photo = customPhoto.get();
            return new LostPetQrPhotoContent(
                    photo.getImageData(), photo.getContentType(), photo.getOriginalFileName());
        }

        PetProfileImageContent profileImage = petProfileImageService.get(
                profile.getPet().getPetId());
        return new LostPetQrPhotoContent(
                profileImage.data(), profileImage.contentType(), profileImage.originalFileName());
    }

    public PublicLostPetProfileResponse getPublicProfile(String publicToken) {
        PetLostQrProfile profile = profileRepository
                .findByPublicTokenAndActiveTrue(publicToken)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        "유효한 실종 대비 프로필을 찾을 수 없습니다."));

        Pet pet = profile.getPet();
        User guardian = pet.getUser();
        if (guardian.getPhone() == null || guardian.getPhone().isBlank()) {
            throw new BusinessException(
                    ErrorCode.RESOURCE_NOT_FOUND,
                    "현재 보호자 연락처를 확인할 수 없습니다.");
        }
        PhotoDetails photo = resolvePublicPhoto(profile);
        return new PublicLostPetProfileResponse(
                profile.isShowGuardianName() ? guardian.getUserName() : null,
                guardian.getPhone(),
                pet.getPetName(),
                profile.isShowPetDetails() ? pet.getSpecies().name() : null,
                profile.isShowPetDetails() ? pet.getBreed() : null,
                profile.isShowMedicalHistory() ? pet.getMedicalHistory() : null,
                photo.url());
    }

    private PetLostQrProfile requireOwnedProfile(String loginId, Long petId) {
        Pet pet = petAccessService.requireOwnedPet(loginId, petId);
        return profileRepository.findByPetPetId(pet.getPetId())
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        "아직 생성된 실종 대비 QR이 없습니다."));
    }

    private LostPetQrProfileResponse toOwnerResponse(PetLostQrProfile profile) {
        return toOwnerResponse(profile, resolveOwnerPhoto(profile));
    }

    private LostPetQrProfileResponse toOwnerResponse(
            PetLostQrProfile profile,
            PhotoDetails photo) {
        Pet pet = profile.getPet();
        User guardian = pet.getUser();
        return new LostPetQrProfileResponse(
                profile.getPublicToken(),
                profile.isActive(),
                guardian.getUserName(),
                guardian.getPhone(),
                pet.getPetName(),
                pet.getSpecies().name(),
                pet.getBreed(),
                pet.getMedicalHistory(),
                photo.url(),
                photo.custom(),
                profile.isShowGuardianName(),
                profile.isShowPetDetails(),
                profile.isShowMedicalHistory());
    }

    private PhotoDetails resolveOwnerPhoto(PetLostQrProfile profile) {
        if (profile.getProfileId() != null) {
            var customPhoto = photoRepository.findById(profile.getProfileId());
            if (customPhoto.isPresent()) {
                LostPetQrPhoto photo = customPhoto.get();
                long version = photo.getUpdatedAt() == null
                        ? System.currentTimeMillis()
                        : photo.getUpdatedAt().toInstant(ZoneOffset.UTC).toEpochMilli();
                return new PhotoDetails(buildOwnerPhotoUrl(profile, version), true);
            }
        }
        return getProfilePhotoFallback(profile.getPet());
    }

    private PhotoDetails resolvePublicPhoto(PetLostQrProfile profile) {
        if (profile.getProfileId() != null) {
            var customPhoto = photoRepository.findById(profile.getProfileId());
            if (customPhoto.isPresent()) {
                LostPetQrPhoto photo = customPhoto.get();
                long version = photo.getUpdatedAt() == null
                        ? System.currentTimeMillis()
                        : photo.getUpdatedAt().toInstant(ZoneOffset.UTC).toEpochMilli();
                return new PhotoDetails(buildPublicPhotoUrl(profile, version), true);
            }
        }
        return getProfilePhotoFallback(profile.getPet());
    }

    private PhotoDetails getProfilePhotoFallback(Pet pet) {
        return new PhotoDetails(
                StringUtils.hasText(pet.getProfileImageUrl()) ? pet.getProfileImageUrl() : null,
                false);
    }

    private String buildOwnerPhotoUrl(PetLostQrProfile profile, long version) {
        return "/api/pets/" + profile.getPet().getPetId()
                + "/lost-qr-profile/photo?v=" + version;
    }

    private String buildPublicPhotoUrl(PetLostQrProfile profile, long version) {
        return "/api/public/lost-pets/" + profile.getPublicToken() + "/photo?v=" + version;
    }

    private byte[] validateAndReadPhoto(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw invalidPhoto("업로드할 사진을 선택해 주세요.");
        }
        if (file.getSize() > MAX_PHOTO_SIZE) {
            throw invalidPhoto("사진은 5MB 이하만 업로드할 수 있습니다.");
        }
        if (!ALLOWED_PHOTO_TYPES.contains(file.getContentType())) {
            throw invalidPhoto("JPG, PNG, WEBP 형식의 이미지만 업로드할 수 있습니다.");
        }

        try {
            byte[] data = file.getBytes();
            if (!hasValidSignature(file.getContentType(), data)) {
                throw invalidPhoto("이미지 파일의 형식이 올바르지 않습니다.");
            }
            return data;
        } catch (IOException exception) {
            throw invalidPhoto("사진을 읽지 못했습니다.");
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
        return cleanName.length() <= 255
                ? cleanName
                : cleanName.substring(cleanName.length() - 255);
    }

    private BusinessException invalidPhoto(String message) {
        return new BusinessException(ErrorCode.INVALID_REQUEST, message);
    }

    private void validatePhone(User guardian) {
        validatePhone(guardian.getPhone());
    }

    private void validatePhone(String phone) {
        if (phone == null || phone.isBlank()) {
            throw new BusinessException(
                    ErrorCode.INVALID_REQUEST,
                    "보호자 연락처를 등록한 후 QR을 생성해 주세요.");
        }
    }

    private String generateUniqueToken() {
        for (int attempt = 0; attempt < 10; attempt++) {
            byte[] bytes = new byte[TOKEN_BYTES];
            SECURE_RANDOM.nextBytes(bytes);
            String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
            if (!profileRepository.existsByPublicToken(token)) {
                return token;
            }
        }
        throw new BusinessException(
                ErrorCode.INTERNAL_SERVER_ERROR,
                "QR 공개 주소를 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }

    private record PhotoDetails(String url, boolean custom) {
    }
}
