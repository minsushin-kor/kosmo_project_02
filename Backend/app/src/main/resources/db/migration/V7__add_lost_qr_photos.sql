CREATE TABLE pet_lost_qr_photos (
    profile_id BIGINT NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    original_file_name VARCHAR(255),
    file_size BIGINT NOT NULL,
    image_data BYTEA NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT pet_lost_qr_photos_pkey PRIMARY KEY (profile_id),
    CONSTRAINT fk_pet_lost_qr_photos_profile
        FOREIGN KEY (profile_id) REFERENCES pet_lost_qr_profiles (profile_id) ON DELETE CASCADE
);
