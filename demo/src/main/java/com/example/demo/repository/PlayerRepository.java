package com.example.demo.repository;

import com.example.demo.Entities.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {
    // השם חייב להיות PointsDesc כדי להתאים ל-Player.java
    List<Player> findByQuizIdOrderByPointsDescTotalResponseTimeAsc(Long quizId);
}