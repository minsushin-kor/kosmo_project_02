package com.petpulse.app.user.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(name = "uk_users_login_id", columnNames = "login_id"),
        @UniqueConstraint(name = "uk_users_email", columnNames = "email")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "login_id", nullable = false, length = 50)
    private String loginId;

    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @Column(name = "email", nullable = false, length = 100)
    private String email;

    @Column(name = "user_name", nullable = false, length = 50)
    private String userName;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "detail_address", length = 255)
    private String detailAddress;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private UserRole role;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public User(
            String loginId,
            String password,
            String email,
            String userName,
            String phone,
            UserRole role) {
        this.loginId = loginId;
        this.password = password;
        this.email = email;
        this.userName = userName;
        this.phone = phone;
        this.role = role;
    }

    public void updateProfile(String userName, String email, String phone) {
        this.userName = userName;
        this.email = email;
        this.phone = phone;
    }

    public void updateAddress(String postalCode, String address, String detailAddress) {
        this.postalCode = postalCode;
        this.address = address;
        this.detailAddress = detailAddress;
    }

    public void changePassword(String encodedPassword) {
        this.password = encodedPassword;
    }
}
