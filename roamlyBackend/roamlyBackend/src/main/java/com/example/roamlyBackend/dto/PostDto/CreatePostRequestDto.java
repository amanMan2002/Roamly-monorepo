package com.example.roamlyBackend.dto.PostDto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder

public class CreatePostRequestDto {
    private String title;
    private String content;
    private String coverImageUrl;
    private List<String> imageUrls;
}
