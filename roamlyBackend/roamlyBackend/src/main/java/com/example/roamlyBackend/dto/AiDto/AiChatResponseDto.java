package com.example.roamlyBackend.dto.AiDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiChatResponseDto {
    private String reply;
    private String conversationId;
    private List<AiPostSummaryDto> referencedPosts;
    private LocalDateTime timestamp;
}
