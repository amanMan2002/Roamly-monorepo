package com.example.roamlyBackend.controllers;

import com.example.roamlyBackend.dto.UserProfileDto;
import com.example.roamlyBackend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * Retrieves the profile and stats (including total likes received) for the logged-in user.
     */
    @GetMapping("/profile")
    public ResponseEntity<UserProfileDto> getCurrentUserProfile() {
        return ResponseEntity.ok(userService.getCurrentUserProfile());
    }

    /**
     * Retrieves the public profile and stats (including total likes received) for any author.
     */
    @GetMapping("/profile/{username}")
    public ResponseEntity<UserProfileDto> getUserProfile(@PathVariable String username) {
        return ResponseEntity.ok(userService.getUserProfileByUsername(username));
    }

    /**
     * Alias for /profile/{username}
     */
    @GetMapping("/{username}")
    public ResponseEntity<UserProfileDto> getUserProfileAlias(@PathVariable String username) {
        return ResponseEntity.ok(userService.getUserProfileByUsername(username));
    }

    /**
     * Quick lookup endpoint for total likes received by an author across all their posts.
     */
    @GetMapping("/{username}/likes")
    public ResponseEntity<Map<String, Object>> getTotalLikesReceived(@PathVariable String username) {
        long totalLikes = userService.getTotalLikesReceived(username);
        return ResponseEntity.ok(Map.of(
                "username", username,
                "totalLikesReceived", totalLikes
        ));
    }
}
