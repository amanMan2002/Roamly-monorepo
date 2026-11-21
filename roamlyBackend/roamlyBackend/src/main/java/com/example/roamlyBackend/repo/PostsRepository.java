package com.example.roamlyBackend.repo;

import com.example.roamlyBackend.entity.Posts;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostsRepository extends JpaRepository<Posts, Long> {

    List<Posts> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(String title, String content);

    List<Posts> findTop10ByOrderByCreatedAtDesc();

    List<Posts> findByUser_UsernameIgnoreCase(String username);

    List<Posts> findByUser_UsernameIgnoreCaseOrderByCreatedAtDesc(String username);

    List<Posts> findByUser_IdOrderByCreatedAtDesc(Long userId);

    long countByUser_Id(Long userId);

    long countByUser_UsernameIgnoreCase(String username);

    @Query("SELECT p FROM Posts p WHERE LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY p.createdAt DESC")
    List<Posts> searchByKeyword(@Param("keyword") String keyword);
}
