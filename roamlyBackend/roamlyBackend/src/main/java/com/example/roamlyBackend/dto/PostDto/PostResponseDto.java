package com.example.roamlyBackend.dto.PostDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PostResponseDto {

    private long id;
    private String title;
    private String content;
    private String coverImageUrl;
    private List<String> imageUrls;
    private String username;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private long likesCount;
    private boolean likedByCurrentUser;

    // Backward-compatible 8-parameter constructor
    public PostResponseDto(long id,
                           String title,
                           String content,
                           String coverImageUrl,
                           List<String> imageUrls,
                           String username,
                           LocalDateTime createdAt,
                           LocalDateTime updatedAt) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.coverImageUrl = coverImageUrl;
        this.imageUrls = imageUrls;
        this.username = username;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.likesCount = 0;
        this.likedByCurrentUser = false;
    }
}
