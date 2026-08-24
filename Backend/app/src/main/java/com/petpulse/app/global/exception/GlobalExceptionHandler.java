package com.petpulse.app.global.exception;

import com.petpulse.app.global.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

        @ExceptionHandler(HttpMessageNotReadableException.class)
        public ResponseEntity<ApiResponse<Void>> handleHttpMessageNotReadable(
                        HttpMessageNotReadableException exception) {

                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(ApiResponse.failure(
                                                "요청 본문의 형식이 올바르지 않습니다. 입력 값을 확인해 주세요.",
                                                ErrorCode.INVALID_REQUEST.getCode()));
        }

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ApiResponse<Void>> handleMethodArgumentNotValid(
                        MethodArgumentNotValidException exception) {

                String message = exception.getBindingResult()
                                .getFieldErrors()
                                .stream()
                                .map(fieldError -> fieldError.getField()
                                                + ": "
                                                + fieldError.getDefaultMessage())
                                .distinct()
                                .collect(Collectors.joining(", "));

                if (message.isBlank()) {
                        message = "입력 값이 올바르지 않습니다.";
                }

                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(ApiResponse.failure(
                                                message,
                                                ErrorCode.INVALID_REQUEST.getCode()));
        }

        @ExceptionHandler(MethodArgumentTypeMismatchException.class)
        public ResponseEntity<Map<String, Object>> handleMethodArgumentTypeMismatch(
                        MethodArgumentTypeMismatchException exception) {

                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(Map.of(
                                                "success", false,
                                                "message", "요청 값의 형식이 올바르지 않습니다.",
                                                "error", ErrorCode.INVALID_REQUEST.getCode()));
        }

        @ExceptionHandler(BusinessException.class)
        public ResponseEntity<Map<String, Object>> handleBusinessException(
                        BusinessException exception) {

                ErrorCode errorCode = exception.getErrorCode();

                return ResponseEntity
                                .status(errorCode.getStatus())
                                .body(Map.of(
                                                "success", false,
                                                "message", exception.getMessage(),
                                                "error", errorCode.getCode()));
        }

        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<Map<String, Object>> handleIllegalArgument(
                        IllegalArgumentException e) {

                return ResponseEntity
                                .status(HttpStatus.NOT_FOUND)
                                .body(Map.of(
                                                "success", false,
                                                "message", e.getMessage()));
        }

        @ExceptionHandler(IllegalStateException.class)
        public ResponseEntity<Map<String, Object>> handleIllegalState(
                        IllegalStateException e) {

                return ResponseEntity
                                .status(HttpStatus.CONFLICT)
                                .body(Map.of(
                                                "success", false,
                                                "message", e.getMessage()));
        }
}
