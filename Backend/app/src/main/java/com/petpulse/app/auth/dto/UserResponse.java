package com.petpulse.app.auth.dto;

import com.petpulse.app.user.entity.User;
import com.petpulse.app.user.entity.UserRole;

public record UserResponse(
        Long userId,
        String loginId,
        String email,
        String userName,
        String phone,
        String postalCode,
        String address,
        String detailAddress,
        UserRole role) {

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getUserId(),
                user.getLoginId(),
                user.getEmail(),
                user.getUserName(),
                user.getPhone(),
                user.getPostalCode(),
                user.getAddress(),
                user.getDetailAddress(),
                user.getRole());
    }
}
