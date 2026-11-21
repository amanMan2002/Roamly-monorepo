package com.example.roamlyBackend.controllers;

import com.example.roamlyBackend.dto.AiDto.AiChatRequestDto;
import com.example.roamlyBackend.dto.AiDto.AiChatResponseDto;
import com.example.roamlyBackend.dto.AiDto.AiDatabaseStatsDto;
import com.example.roamlyBackend.dto.AiDto.AiPostSummaryDto;
import com.example.roamlyBackend.dto.AiDto.AiStoryGenerationRequestDto;
import com.example.roamlyBackend.service.AiAssistantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponseDto> chat(@RequestBody AiChatRequestDto requestDto) {
        AiChatResponseDto response = aiAssistantService.chat(requestDto);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    public ResponseEntity<AiDatabaseStatsDto> getStats() {
        return ResponseEntity.ok(aiAssistantService.getDatabaseStats());
    }

    @PostMapping("/generate-story")
    public ResponseEntity<Map<String, String>> generateStory(@RequestBody AiStoryGenerationRequestDto requestDto) {
        String story = aiAssistantService.generateStory(requestDto);
        return ResponseEntity.ok(Map.of("story", story));
    }

    @GetMapping("/search-posts")
    public ResponseEntity<List<AiPostSummaryDto>> searchPosts(@RequestParam(defaultValue = "") String query) {
        return ResponseEntity.ok(aiAssistantService.searchPosts(query));
    }
}
