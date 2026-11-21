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
public class AiDatabaseStatsDto {
    private long totalPosts;
    private long totalUsers;
    private String summary;
}
