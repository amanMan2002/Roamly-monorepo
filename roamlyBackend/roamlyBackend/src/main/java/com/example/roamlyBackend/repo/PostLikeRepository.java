package com.example.roamlyBackend.repo;

import com.example.roamlyBackend.entity.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

    Optional<PostLike> findByUserIdAndPostId(Long userId, Long postId);

    boolean existsByUserIdAndPostId(Long userId, Long postId);

    long countByPostId(Long postId);

    long countByUserId(Long userId);

    List<PostLike> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT COUNT(pl) FROM PostLike pl WHERE pl.post.user.id = :userId")
    long countTotalLikesReceivedByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(pl) FROM PostLike pl WHERE LOWER(pl.post.user.username) = LOWER(:username)")
    long countTotalLikesReceivedByUsername(@Param("username") String username);

    @Transactional
    @Modifying
    @Query("DELETE FROM PostLike pl WHERE pl.user.id = :userId AND pl.post.id = :postId")
    void deleteByUserIdAndPostId(@Param("userId") Long userId, @Param("postId") Long postId);

    @Transactional
    @Modifying
    @Query("DELETE FROM PostLike pl WHERE pl.post.id = :postId")
    void deleteByPostId(@Param("postId") Long postId);
}
