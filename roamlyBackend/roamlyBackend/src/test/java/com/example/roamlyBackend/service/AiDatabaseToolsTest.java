package com.example.roamlyBackend.service;

import com.example.roamlyBackend.dto.AiDto.AiPostSummaryDto;
import com.example.roamlyBackend.entity.AppUser;
import com.example.roamlyBackend.entity.Posts;
import com.example.roamlyBackend.repo.PostsRepository;
import com.example.roamlyBackend.repo.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiDatabaseToolsTest {

    @Mock
    private PostsRepository postsRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AiDatabaseTools aiDatabaseTools;

    private Posts samplePost;
    private AppUser sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = AppUser.builder()
                .id(1L)
                .username("traveler_sam")
                .build();

        samplePost = Posts.builder()
                .id(101L)
                .title("Exploring Kyoto in Autumn")
                .content("Kyoto was breathtaking with vibrant red maple leaves around Arashiyama.")
                .coverImageUrl("https://example.com/kyoto.jpg")
                .user(sampleUser)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void searchTravelPosts_shouldReturnMatchingSummaries() {
        when(postsRepository.searchByKeyword("Kyoto")).thenReturn(List.of(samplePost));

        List<AiPostSummaryDto> results = aiDatabaseTools.searchTravelPosts("Kyoto");

        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals("Exploring Kyoto in Autumn", results.get(0).getTitle());
        assertEquals("traveler_sam", results.get(0).getAuthor());
        verify(postsRepository, times(1)).searchByKeyword("Kyoto");
    }

    @Test
    void getRecentTravelPosts_shouldReturnLatest() {
        when(postsRepository.findTop10ByOrderByCreatedAtDesc()).thenReturn(List.of(samplePost));

        List<AiPostSummaryDto> results = aiDatabaseTools.getRecentTravelPosts(5);

        assertEquals(1, results.size());
        assertEquals(101L, results.get(0).getId());
    }

    @Test
    void getPostsByAuthor_shouldFilterByUsername() {
        when(postsRepository.findByUser_UsernameIgnoreCase("traveler_sam")).thenReturn(List.of(samplePost));

        List<AiPostSummaryDto> results = aiDatabaseTools.getPostsByAuthor("traveler_sam");

        assertEquals(1, results.size());
        assertEquals("Kyoto was breathtaking with vibrant red maple leaves around Arashiyama.", results.get(0).getSnippet());
    }

    @Test
    void getPostDetails_shouldReturnPostById() {
        when(postsRepository.findById(101L)).thenReturn(Optional.of(samplePost));

        AiPostSummaryDto result = aiDatabaseTools.getPostDetails(101L);

        assertNotNull(result);
        assertEquals(101L, result.getId());
        assertEquals("traveler_sam", result.getAuthor());
    }

    @Test
    void getDatabaseStatistics_shouldAggregateCounts() {
        when(postsRepository.count()).thenReturn(42L);
        when(userRepository.count()).thenReturn(15L);

        Map<String, Object> stats = aiDatabaseTools.getDatabaseStatistics();

        assertEquals(42L, stats.get("totalPosts"));
        assertEquals(15L, stats.get("totalUsers"));
        assertEquals("Roamly Travel Platform", stats.get("platform"));
    }
}
