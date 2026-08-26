CREATE TABLE pet_profile_images (
    pet_id BIGINT NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    original_file_name VARCHAR(255),
    file_size BIGINT NOT NULL,
    image_data BYTEA NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT pet_profile_images_pkey PRIMARY KEY (pet_id),
    CONSTRAINT fk_pet_profile_images_pet
        FOREIGN KEY (pet_id) REFERENCES pets (pet_id) ON DELETE CASCADE
);
