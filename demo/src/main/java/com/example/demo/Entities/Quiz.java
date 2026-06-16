package com.example.demo.Entities;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class Quiz {
    @Id
    private Long id; // הקוד של החידון הוא גם ה-ID שלו כאן

    private String code;
    private String title;
    private String creatorEmail;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer timeLimit;
    private String winnerName;
    private Integer winnerScore;
    private int topScore;
}