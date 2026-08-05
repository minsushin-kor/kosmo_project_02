package com.petpulse.app.global.exception;

import com.petpulse.app.global.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(
            BusinessException exception) {
        ErrorCode errorCode = exception.getErrorCode();

        ApiResponse<Void> response = ApiResponse.failure(
                exception.getMessage(),
                errorCode.getCode());

        return ResponseEntity
                .status(errorCode.getStatus())
                .body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(
            Exception exception) {
        ErrorCode errorCode = ErrorCode.INTERNAL_SERVER_ERROR;

        ApiResponse<Void> response = ApiResponse.failure(
                errorCode.getMessage(),
                errorCode.getCode());

        return ResponseEntity
                .status(errorCode.getStatus())
                .body(response);
    }
}