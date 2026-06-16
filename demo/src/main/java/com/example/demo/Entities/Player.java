package com.example.demo.Entities;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Player {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String displayName;
    private String profileImage;
    private int points = 0; // אתחול ל-0
    private String quizCode;

    @ManyToOne
    @JoinColumn(name = "quiz_id")
    private Quiz quiz;

    private Long totalResponseTime = 0L;
}