package com.example.roamlyBackend.dto.PostDto;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder



public class PostRequestDto {

    private Long id;
    private String title;
    private String content;


}

