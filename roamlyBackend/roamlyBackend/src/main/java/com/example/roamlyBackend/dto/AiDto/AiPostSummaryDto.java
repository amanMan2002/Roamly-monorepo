package com.example.roamlyBackend.dto.AiDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiPostSummaryDto {
    private Long id;
    private String title;
    private String author;
    private String snippet;
    private String coverImageUrl;
    private LocalDateTime createdAt;
}
