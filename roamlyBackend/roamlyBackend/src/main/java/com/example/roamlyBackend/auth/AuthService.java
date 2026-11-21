package com.example.roamlyBackend.auth;

import com.example.roamlyBackend.dto.LoginRequestDto;
import com.example.roamlyBackend.dto.LoginResponseDto;
import com.example.roamlyBackend.dto.SignUpResponseDto;
import com.example.roamlyBackend.entity.AppUser;
import com.example.roamlyBackend.repo.UserRepository;
import com.example.roamlyBackend.security.AuthUtil;
import com.example.roamlyBackend.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;




@Service
@RequiredArgsConstructor
public class AuthService {
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final AuthUtil authUtil;
    private final PasswordEncoder passwordEncoder;



    public LoginResponseDto login(LoginRequestDto loginRequestDto) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequestDto.getUsername(),
                        loginRequestDto.getPassword()));

        AppUser appUser = (AppUser) authentication.getPrincipal();

        String token = jwtService.generateToken(appUser, appUser.getId());

        return new LoginResponseDto(token, appUser.getId());
    }

    public SignUpResponseDto signup(LoginRequestDto signupRequestDto) {
        AppUser existingUser = userRepository
                .findByUsername(signupRequestDto.getUsername())
                .orElse(null);

        if (existingUser != null) {
            throw new RuntimeException("Username is already in use");
        }

        AppUser appUser = userRepository.save(
                AppUser.builder()
                        .username(signupRequestDto.getUsername())
                        .password(passwordEncoder.encode(
                                signupRequestDto.getPassword()
                        ))
                        .build()
        );

        return new SignUpResponseDto(
                appUser.getId(),
                appUser.getUsername()
        );
    }
}