package com.example.roamlyBackend.controllers;

import com.example.roamlyBackend.dto.PostDto.CreatePostRequestDto;
import com.example.roamlyBackend.dto.PostDto.LikeResponseDto;
import com.example.roamlyBackend.dto.PostDto.PostResponseDto;
import com.example.roamlyBackend.service.PostsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostsController {

    private final PostsService postsService;

    @GetMapping
    public List<PostResponseDto> findAll() {
        return postsService.findAll();
    }

    @GetMapping("/{id}")
    public PostResponseDto findById(@PathVariable Long id) {
        return postsService.findById(id);
    }

    @PostMapping
    public PostResponseDto createPost(@RequestBody CreatePostRequestDto requestDto) {
        return postsService.createPost(requestDto);
    }

    /**
     * Likes/saves a post (or unlikes/unsaves if already liked) by the authenticated user.
     */
    @PostMapping("/{id}/like")
    public ResponseEntity<LikeResponseDto> toggleLike(@PathVariable Long id) {
        return ResponseEntity.ok(postsService.toggleLike(id));
    }

    /**
     * Explicitly unlikes and removes a post from saved collection.
     */
    @DeleteMapping("/{id}/like")
    public ResponseEntity<LikeResponseDto> unlikePost(@PathVariable Long id) {
        return ResponseEntity.ok(postsService.unlikePost(id));
    }

    /**
     * Checks if current user has liked this post and retrieves total likes.
     */
    @GetMapping("/{id}/like-status")
    public ResponseEntity<LikeResponseDto> getLikeStatus(@PathVariable Long id) {
        return ResponseEntity.ok(postsService.getLikeStatus(id));
    }

    /**
     * Retrieves all posts liked/saved by the authenticated user.
     */
    @GetMapping("/saved")
    public ResponseEntity<List<PostResponseDto>> getSavedPosts() {
        return ResponseEntity.ok(postsService.getSavedPosts());
    }

    /**
     * Alias for /saved to support /api/posts/liked convention.
     */
    @GetMapping("/liked")
    public ResponseEntity<List<PostResponseDto>> getLikedPosts() {
        return ResponseEntity.ok(postsService.getSavedPosts());
    }

    /**
     * Retrieves all posts created by the authenticated user.
     */
    @GetMapping("/my-posts")
    public ResponseEntity<List<PostResponseDto>> getMyPosts() {
        return ResponseEntity.ok(postsService.getMyPosts());
    }

    /**
     * Retrieves all posts created by a specific username.
     */
    @GetMapping("/user/{username}")
    public ResponseEntity<List<PostResponseDto>> getPostsByUsername(@PathVariable String username) {
        return ResponseEntity.ok(postsService.getPostsByUsername(username));
    }
}
