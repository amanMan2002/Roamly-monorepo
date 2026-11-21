package com.example.roamlyBackend.dto.PostDto;

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
public class LikeResponseDto {

    private Long postId;
    private boolean liked;
    private long totalLikes;
    private String message;
}
