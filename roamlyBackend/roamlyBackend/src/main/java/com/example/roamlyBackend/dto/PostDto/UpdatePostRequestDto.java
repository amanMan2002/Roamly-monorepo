package com.example.roamlyBackend.dto.PostDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdatePostRequestDto {
    private String title;
    private String content;
}