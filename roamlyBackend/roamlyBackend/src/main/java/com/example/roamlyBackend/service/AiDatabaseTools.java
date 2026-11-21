package com.example.roamlyBackend.service;

import com.example.roamlyBackend.dto.AiDto.AiPostSummaryDto;
import com.example.roamlyBackend.entity.Posts;
import com.example.roamlyBackend.repo.PostsRepository;
import com.example.roamlyBackend.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class AiDatabaseTools {

    private final PostsRepository postsRepository;
    private final UserRepository userRepository;


@Tool(description = "Search travel posts in the Roamly database by keyword matching title or content.")
public List<AiPostSummaryDto> searchTravelPosts(
        @ToolParam(description = "Keyword to search for") String query) {

    log.info("1. Tool execution started. Query: {}", query);

    if (query == null || query.isBlank()) {
        log.info("2. Query is blank. Fetching recent posts");

        List<AiPostSummaryDto> result = getRecentTravelPosts(5);

        log.info("3. Recent posts retrieved: {}", result.size());

        return result;
    }

    log.info("2. Executing repository query");

    var posts = postsRepository.searchByKeyword(query.trim());

    log.info("3. Repository query completed. Found: {}", posts.size());

    var result = posts.stream()
            .limit(10)
            .map(this::mapToSummary)
            .toList();

    log.info("4. DTO mapping completed. Result size: {}", result.size());

    return result;
}

    @Tool(description = "Retrieve the latest travel stories and posts published in the database.")
    public List<AiPostSummaryDto> getRecentTravelPosts(
            @ToolParam(description = "Number of posts to retrieve (max 10)") int limit) {
        int max = limit <= 0 ? 5 : Math.min(limit, 10);
        log.info("AI tool called: getRecentTravelPosts with limit: {}", max);
        return postsRepository.findTop10ByOrderByCreatedAtDesc()
                .stream()
                .limit(max)
                .map(this::mapToSummary)
                .toList();
    }

    @Tool(description = "Retrieve all travel posts written by a specific author username.")
    public List<AiPostSummaryDto> getPostsByAuthor(
            @ToolParam(description = "Username of the author") String username) {
        log.info("AI tool called: getPostsByAuthor for user: {}", username);
        if (username == null || username.isBlank()) {
            return List.of();
        }
        return postsRepository.findByUser_UsernameIgnoreCase(username.trim())
                .stream()
                .map(this::mapToSummary)
                .toList();
    }

    @Tool(description = "Retrieve the full details of a specific travel post by its ID.")
    public AiPostSummaryDto getPostDetails(
            @ToolParam(description = "Database ID of the travel post") Long id) {
        log.info("AI tool called: getPostDetails for ID: {}", id);
        if (id == null) {
            return null;
        }
        return postsRepository.findById(id)
                .map(this::mapToSummary)
                .orElse(null);
    }

    @Tool(description = "Get statistics about the Roamly database such as total travel posts and registered users.")
    public Map<String, Object> getDatabaseStatistics() {
        log.info("AI tool called: getDatabaseStatistics");
        Map<String, Object> stats = new HashMap<>();
        long postCount = postsRepository.count();
        long userCount = userRepository.count();
        stats.put("totalPosts", postCount);
        stats.put("totalUsers", userCount);
        stats.put("platform", "Roamly Travel Platform");
        return stats;
    }

    public AiPostSummaryDto mapToSummary(Posts post) {
        String content = post.getContent();
        String snippet = content != null && content.length() > 200
                ? content.substring(0, 200) + "..."
                : content;

        String author = post.getUser() != null ? post.getUser().getUsername() : "Anonymous";

        return AiPostSummaryDto.builder()
                .id(post.getId())
                .title(post.getTitle())
                .author(author)
                .snippet(snippet)
                .coverImageUrl(post.getCoverImageUrl())
                .createdAt(post.getCreatedAt())
                .build();
    }
}
