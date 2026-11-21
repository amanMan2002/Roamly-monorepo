package com.example.roamlyBackend.controllers;

import com.example.roamlyBackend.auth.AuthService;
import com.example.roamlyBackend.dto.LoginRequestDto;
import com.example.roamlyBackend.dto.LoginResponseDto;
import com.example.roamlyBackend.dto.SignUpResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@RequestBody LoginRequestDto loginRequestDto) {

        return ResponseEntity.ok(authService.login(loginRequestDto));

    }

    @PostMapping("/signup")
    public ResponseEntity<SignUpResponseDto> signup(@RequestBody LoginRequestDto signupRequestDto) {
        return ResponseEntity.ok(authService.signup(signupRequestDto));
    }
}
