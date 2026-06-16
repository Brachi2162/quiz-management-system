package com.example.demo.Entities;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // קוד שאלה [cite: 28]

    @ManyToOne
    @JoinColumn(name = "quiz_id")
    private Quiz quiz; // מפתח זר לחידון [cite: 28]

    private String questionText; // תוכן השאלה [cite: 28]
    private String answer1; // התשובה הנכונה (תמיד הראשונה באקסל) [cite: 7, 8, 28]
    private String answer2; // תשובה לא נכונה [cite: 28]
    private String answer3; // תשובה לא נכונה [cite: 28]
    private String answer4; // תשובה לא נכונה [cite: 28]
    private Integer points; // מספר נקודות לשאלה [cite: 8]
    private Integer timeLimit; // זמן מענה בשניות [cite: 28]
    private String difficulty; // רמת קושי [cite: 28]
}