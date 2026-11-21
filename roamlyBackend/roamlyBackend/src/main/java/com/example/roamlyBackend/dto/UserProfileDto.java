package com.example.roamlyBackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserProfileDto {

    private Long id;
    private String username;
    private long totalPosts;
    private long totalLikesReceived;
    private long totalSavedPosts;
}
