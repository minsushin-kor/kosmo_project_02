package com.petpulse.app.lostpet.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "pet_lost_qr_photos")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LostPetQrPhoto {

    @Id
    @Column(name = "profile_id")
    private Long profileId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "profile_id",
            foreignKey = @ForeignKey(name = "fk_pet_lost_qr_photos_profile"))
    private PetLostQrProfile profile;

    @Column(name = "content_type", nullable = false, length = 50)
    private String contentType;

    @Column(name = "original_file_name", length = 255)
    private String originalFileName;

    @Column(name = "file_size", nullable = false)
    private long fileSize;

    @Lob
    @JdbcTypeCode(SqlTypes.VARBINARY)
    @Column(name = "image_data", nullable = false, columnDefinition = "BYTEA")
    private byte[] imageData;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public LostPetQrPhoto(
            PetLostQrProfile profile,
            String contentType,
            String originalFileName,
            byte[] imageData) {
        this.profile = profile;
        update(contentType, originalFileName, imageData);
    }

    public void update(String contentType, String originalFileName, byte[] imageData) {
        this.contentType = contentType;
        this.originalFileName = originalFileName;
        this.fileSize = imageData.length;
        this.imageData = imageData;
    }
}
