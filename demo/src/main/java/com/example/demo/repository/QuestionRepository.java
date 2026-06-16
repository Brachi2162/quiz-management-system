package com.example.demo.repository;

import com.example.demo.Entities.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    // שליפת כל השאלות השייכות לחידון ספציפי
    // השדה בתוך Question חייב להיקרא quiz (כמפתח זר)
    List<Question> findByQuizId(Long quizId);
}