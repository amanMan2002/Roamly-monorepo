package com.example.roamlyBackend.service;

import com.example.roamlyBackend.dto.PostDto.CreatePostRequestDto;
import com.example.roamlyBackend.dto.PostDto.LikeResponseDto;
import com.example.roamlyBackend.dto.PostDto.PostResponseDto;
import com.example.roamlyBackend.entity.AppUser;
import com.example.roamlyBackend.entity.PostLike;
import com.example.roamlyBackend.entity.Posts;
import com.example.roamlyBackend.repo.PostLikeRepository;
import com.example.roamlyBackend.repo.PostsRepository;
import com.example.roamlyBackend.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostsService {

    private final PostsRepository postsRepository;
    private final UserRepository userRepository;
    private final PostLikeRepository postLikeRepository;

    public PostResponseDto findById(long id) {
        Posts post = postsRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Post with id " + id + " not found!"
                ));

        return toDto(post, getOptionalAuthenticatedUser());
    }

    public List<PostResponseDto> findAll() {
        Optional<AppUser> currentUserOpt = getOptionalAuthenticatedUser();
        return postsRepository.findAll()
                .stream()
                .map(post -> toDto(post, currentUserOpt))
                .toList();
    }

    @Transactional
    public PostResponseDto createPost(CreatePostRequestDto requestDto) {
        AppUser user = getCurrentAuthenticatedUser();

        Posts post = new Posts();
        post.setTitle(requestDto.getTitle());
        post.setContent(requestDto.getContent());
        post.setUser(user);
        post.setCoverImageUrl(requestDto.getCoverImageUrl());
        post.setCreatedAt(LocalDateTime.now());
        post.setImageUrls(requestDto.getImageUrls());

        Posts savedPost = postsRepository.save(post);
        return toDto(savedPost, Optional.of(user));
    }

    /**
     * Toggles like/save on a post.
     * If user already liked the post: unlikes and removes it from their saved collection.
     * If user hasn't liked the post yet: likes and saves it into their account.
     * Disallows a user from liking their own post.
     */
    @Transactional
    public LikeResponseDto toggleLike(Long postId) {
        AppUser currentUser = getCurrentAuthenticatedUser();

        Posts post = postsRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));

        if (post.getUser() != null && post.getUser().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot like your own post");
        }

        Optional<PostLike> existingLike = postLikeRepository.findByUserIdAndPostId(currentUser.getId(), postId);

        if (existingLike.isPresent()) {
            postLikeRepository.delete(existingLike.get());
            long totalLikes = postLikeRepository.countByPostId(postId);
            log.info("User {} unliked post {}", currentUser.getUsername(), postId);
            return LikeResponseDto.builder()
                    .postId(postId)
                    .liked(false)
                    .totalLikes(totalLikes)
                    .message("Post unliked and removed from saved posts")
                    .build();
        } else {
            PostLike newLike = PostLike.builder()
                    .user(currentUser)
                    .post(post)
                    .createdAt(LocalDateTime.now())
                    .build();
            postLikeRepository.save(newLike);
            long totalLikes = postLikeRepository.countByPostId(postId);
            log.info("User {} liked post {}", currentUser.getUsername(), postId);
            return LikeResponseDto.builder()
                    .postId(postId)
                    .liked(true)
                    .totalLikes(totalLikes)
                    .message("Post liked and saved to your account")
                    .build();
        }
    }

    /**
     * Explicitly unlikes and removes post from saved collection.
     */
    @Transactional
    public LikeResponseDto unlikePost(Long postId) {
        AppUser currentUser = getCurrentAuthenticatedUser();

        if (!postsRepository.existsById(postId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found");
        }

        postLikeRepository.deleteByUserIdAndPostId(currentUser.getId(), postId);
        long totalLikes = postLikeRepository.countByPostId(postId);

        return LikeResponseDto.builder()
                .postId(postId)
                .liked(false)
                .totalLikes(totalLikes)
                .message("Post unliked and removed from saved posts")
                .build();
    }

    /**
     * Retrieves all posts liked/saved by the currently authenticated user.
     */
    public List<PostResponseDto> getSavedPosts() {
        AppUser currentUser = getCurrentAuthenticatedUser();
        List<PostLike> likes = postLikeRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId());

        return likes.stream()
                .map(like -> toDto(like.getPost(), Optional.of(currentUser)))
                .toList();
    }

    /**
     * Checks if current user has liked a post and gets total likes on that post.
     */
    public LikeResponseDto getLikeStatus(Long postId) {
        if (!postsRepository.existsById(postId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found");
        }

        long totalLikes = postLikeRepository.countByPostId(postId);
        boolean liked = getOptionalAuthenticatedUser()
                .map(u -> postLikeRepository.existsByUserIdAndPostId(u.getId(), postId))
                .orElse(false);

        return LikeResponseDto.builder()
                .postId(postId)
                .liked(liked)
                .totalLikes(totalLikes)
                .message(liked ? "Liked" : "Not liked")
                .build();
    }

    /**
     * Retrieves posts written by a specific username.
     */
    public List<PostResponseDto> getPostsByUsername(String username) {
        Optional<AppUser> currentUserOpt = getOptionalAuthenticatedUser();
        return postsRepository.findByUser_UsernameIgnoreCaseOrderByCreatedAtDesc(username)
                .stream()
                .map(post -> toDto(post, currentUserOpt))
                .toList();
    }

    /**
     * Retrieves posts written by current logged-in user.
     */
    public List<PostResponseDto> getMyPosts() {
        AppUser currentUser = getCurrentAuthenticatedUser();
        return postsRepository.findByUser_IdOrderByCreatedAtDesc(currentUser.getId())
                .stream()
                .map(post -> toDto(post, Optional.of(currentUser)))
                .toList();
    }

    public PostResponseDto toDto(Posts post, Optional<AppUser> currentUserOpt) {
        long likesCount = postLikeRepository.countByPostId(post.getId());
        boolean liked = currentUserOpt
                .map(u -> postLikeRepository.existsByUserIdAndPostId(u.getId(), post.getId()))
                .orElse(false);

        String authorUsername = post.getUser() != null ? post.getUser().getUsername() : "Anonymous";

        return PostResponseDto.builder()
                .id(post.getId())
                .title(post.getTitle())
                .content(post.getContent())
                .coverImageUrl(post.getCoverImageUrl())
                .imageUrls(post.getImageUrls())
                .username(authorUsername)
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .likesCount(likesCount)
                .likedByCurrentUser(liked)
                .build();
    }

    private Optional<AppUser> getOptionalAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            return Optional.empty();
        }
        return userRepository.findByUsername(authentication.getName());
    }

    private AppUser getCurrentAuthenticatedUser() {
        return getOptionalAuthenticatedUser()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User must be authenticated"));
    }
}
