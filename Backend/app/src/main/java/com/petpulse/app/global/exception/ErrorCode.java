package com.petpulse.app.global.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {

    INVALID_REQUEST(
            HttpStatus.BAD_REQUEST,
            "INVALID_REQUEST",
            "잘못된 요청입니다."),

    RESOURCE_NOT_FOUND(
            HttpStatus.NOT_FOUND,
            "RESOURCE_NOT_FOUND",
            "요청한 데이터를 찾을 수 없습니다."),

    INTERNAL_SERVER_ERROR(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "INTERNAL_SERVER_ERROR",
            "서버 내부 오류가 발생했습니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;

    ErrorCode(
            HttpStatus status,
            String code,
            String message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}