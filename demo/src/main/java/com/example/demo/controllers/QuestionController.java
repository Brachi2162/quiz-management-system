package com.example.demo.controllers;

import com.example.demo.Entities.Question;
import com.example.demo.Entities.Quiz;
import com.example.demo.repository.QuestionRepository;
import com.example.demo.repository.QuizRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
@CrossOrigin(origins = "*")
public class QuestionController {

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private QuizRepository quizRepository;

    @GetMapping("/quiz/{quizId}")
    public List<Question> getQuestionsByQuiz(@PathVariable Long quizId) {
        return questionRepository.findByQuizId(quizId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Question> getQuestion(@PathVariable Long id) {
        return questionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createQuestion(@RequestBody QuestionRequest request) {
        try {
            Quiz quiz = quizRepository.findById(request.getQuizId())
                    .orElseThrow(() -> new RuntimeException("Quiz not found"));

            Question question = new Question();
            question.setQuiz(quiz);
            question.setQuestionText(request.getQuestionText());
            question.setAnswer1(request.getAnswer1());
            question.setAnswer2(request.getAnswer2());
            question.setAnswer3(request.getAnswer3());
            question.setAnswer4(request.getAnswer4());
            question.setPoints(request.getPoints());
            question.setTimeLimit(request.getTimeLimit());

            Question saved = questionRepository.save(question);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error creating question: " + e.getMessage());
        }
    }

    // Inner class for request data
    static class QuestionRequest {
        private Long quizId;
        private String questionText;
        private String answer1;
        private String answer2;
        private String answer3;
        private String answer4;
        private Integer points;
        private Integer timeLimit;

        // Getters and setters
        public Long getQuizId() { return quizId; }
        public void setQuizId(Long quizId) { this.quizId = quizId; }
        public String getQuestionText() { return questionText; }
        public void setQuestionText(String questionText) { this.questionText = questionText; }
        public String getAnswer1() { return answer1; }
        public void setAnswer1(String answer1) { this.answer1 = answer1; }
        public String getAnswer2() { return answer2; }
        public void setAnswer2(String answer2) { this.answer2 = answer2; }
        public String getAnswer3() { return answer3; }
        public void setAnswer3(String answer3) { this.answer3 = answer3; }
        public String getAnswer4() { return answer4; }
        public void setAnswer4(String answer4) { this.answer4 = answer4; }
        public Integer getPoints() { return points; }
        public void setPoints(Integer points) { this.points = points; }
        public Integer getTimeLimit() { return timeLimit; }
        public void setTimeLimit(Integer timeLimit) { this.timeLimit = timeLimit; }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateQuestion(@PathVariable Long id, @RequestBody Question questionData) {
        try {
            Question question = questionRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Question not found"));

            question.setQuestionText(questionData.getQuestionText());
            question.setAnswer1(questionData.getAnswer1());
            question.setAnswer2(questionData.getAnswer2());
            question.setAnswer3(questionData.getAnswer3());
            question.setAnswer4(questionData.getAnswer4());
            question.setPoints(questionData.getPoints());
            question.setTimeLimit(questionData.getTimeLimit());

            Question saved = questionRepository.save(question);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error updating question: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteQuestion(@PathVariable Long id) {
        try {
            questionRepository.deleteById(id);
            return ResponseEntity.ok("Question deleted");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error deleting question: " + e.getMessage());
        }
    }
}
