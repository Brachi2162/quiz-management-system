package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class QuestionDTO {
    private Long id;
    private String questionText;
    private List<String> shuffledAnswers;
    private int points;
    private Integer timeLimit;
    private String correctAnswer; // The correct answer for client-side validation

    // Constructor for backward compatibility
    public QuestionDTO(Long id, String questionText, List<String> shuffledAnswers, int points) {
        this.id = id;
        this.questionText = questionText;
        this.shuffledAnswers = shuffledAnswers;
        this.points = points;
        this.timeLimit = 20; // default
        this.correctAnswer = null;
    }

    // Constructor without correctAnswer
    public QuestionDTO(Long id, String questionText, List<String> shuffledAnswers, int points, Integer timeLimit) {
        this.id = id;
        this.questionText = questionText;
        this.shuffledAnswers = shuffledAnswers;
        this.points = points;
        this.timeLimit = timeLimit;
        this.correctAnswer = null;
    }
}