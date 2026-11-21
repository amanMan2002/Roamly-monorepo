package com.example.roamlyBackend.service;

import com.example.roamlyBackend.dto.UserProfileDto;
import com.example.roamlyBackend.entity.AppUser;
import com.example.roamlyBackend.repo.PostLikeRepository;
import com.example.roamlyBackend.repo.PostsRepository;
import com.example.roamlyBackend.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PostsRepository postsRepository;
    private final PostLikeRepository postLikeRepository;

    /**
     * Retrieves the profile and like stats for the currently authenticated user.
     */
    public UserProfileDto getCurrentUserProfile() {
        AppUser currentUser = getCurrentAuthenticatedUser();
        return buildProfileDto(currentUser);
    }

    /**
     * Retrieves the public profile and like stats for any author by username.
     */
    public UserProfileDto getUserProfileByUsername(String username) {
        AppUser user = userRepository.findByUsername(username.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User '" + username + "' not found"));
        return buildProfileDto(user);
    }

    /**
     * Returns the total number of likes received by a user across all their posts.
     */
    public long getTotalLikesReceived(String username) {
        if (!userRepository.findByUsername(username.trim()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User '" + username + "' not found");
        }
        return postLikeRepository.countTotalLikesReceivedByUsername(username.trim());
    }

    private UserProfileDto buildProfileDto(AppUser user) {
        long totalPosts = postsRepository.countByUser_Id(user.getId());
        long totalLikesReceived = postLikeRepository.countTotalLikesReceivedByUserId(user.getId());
        long totalSavedPosts = postLikeRepository.countByUserId(user.getId());

        return UserProfileDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .totalPosts(totalPosts)
                .totalLikesReceived(totalLikesReceived)
                .totalSavedPosts(totalSavedPosts)
                .build();
    }

    private AppUser getCurrentAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User must be authenticated");
        }
        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
