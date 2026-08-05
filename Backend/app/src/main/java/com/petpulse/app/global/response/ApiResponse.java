package com.petpulse.app.global.response;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        boolean success,
        T data,
        String message,
        String error) {

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(
                true,
                data,
                null,
                null);
    }

    public static <T> ApiResponse<T> success(
            T data,
            String message) {
        return new ApiResponse<>(
                true,
                data,
                message,
                null);
    }

    public static ApiResponse<Void> success(
            String message) {
        return new ApiResponse<>(
                true,
                null,
                message,
                null);
    }

    public static ApiResponse<Void> failure(
            String message,
            String error) {
        return new ApiResponse<>(
                false,
                null,
                message,
                error);
    }
}