package com.petpulse.app.pet.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "pet_profile_images")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PetProfileImage {

    @Id
    @Column(name = "pet_id")
    private Long petId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "pet_id", foreignKey = @ForeignKey(name = "fk_pet_profile_images_pet"))
    private Pet pet;

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

    public PetProfileImage(Pet pet, String contentType, String originalFileName,
            byte[] imageData) {
        this.pet = pet;
        update(contentType, originalFileName, imageData);
    }

    public void update(String contentType, String originalFileName, byte[] imageData) {
        this.contentType = contentType;
        this.originalFileName = originalFileName;
        this.fileSize = imageData.length;
        this.imageData = imageData;
    }
}
