ALTER TABLE pet_lost_qr_profiles
    ADD COLUMN show_guardian_name BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN show_pet_details BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN show_medical_history BOOLEAN NOT NULL DEFAULT TRUE;
