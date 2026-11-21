package com.example.roamlyBackend.dto.AiDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiStoryGenerationRequestDto {
    private String destination;
    private String highlights;
    private String tone;
}
