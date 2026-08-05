package com.petpulse.app.test;

import com.petpulse.app.global.exception.BusinessException;
import com.petpulse.app.global.exception.ErrorCode;
import com.petpulse.app.global.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class TestController {

    @GetMapping("/api/test")
    public ApiResponse<Map<String, String>> test() {
        Map<String, String> responseData = Map.of(
                "status", "running",
                "service", "PetPulse Backend");

        return ApiResponse.success(
                responseData,
                "PetPulse API 연결 성공");
    }

    @GetMapping("/api/test/error")
    public ApiResponse<Void> testError() {
        throw new BusinessException(
                ErrorCode.RESOURCE_NOT_FOUND,
                "테스트 데이터를 찾을 수 없습니다.");
    }
}