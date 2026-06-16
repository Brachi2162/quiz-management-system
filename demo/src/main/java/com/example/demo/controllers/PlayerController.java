package com.example.demo.controllers;

import com.example.demo.Entities.Player;
import com.example.demo.Entities.Quiz;
import com.example.demo.dto.QuestionDTO;
import com.example.demo.repository.PlayerRepository;
import com.example.demo.repository.QuizRepository;
import com.example.demo.service.QuizService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/player")
@CrossOrigin(origins = "*")
public class PlayerController {

    @Autowired private QuizService quizService;
    @Autowired private QuizRepository quizRepository;
    @Autowired private PlayerRepository playerRepository;

    @PostMapping("/join/{code}")
    public ResponseEntity<?> joinQuiz(@PathVariable String code, @RequestBody Player player) {
        Quiz quiz = quizRepository.findByCode(code);

        if (quiz == null) {
            return ResponseEntity.status(404).body("חידון לא נמצא");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(quiz.getStartTime()) || now.isAfter(quiz.getEndTime())) {
            return ResponseEntity.status(403).body("החידון סגור כרגע");
        }

        player.setQuiz(quiz);
        player.setQuizCode(code);
        player.setPoints(0);

        Player savedPlayer = playerRepository.save(player);
        return ResponseEntity.ok(savedPlayer);
    }

    @GetMapping("/next-question/{quizId}")
    public QuestionDTO getNextQuestion(@PathVariable Long quizId) {
        return quizService.getNextRandomQuestion(quizId);
    }

    @PostMapping("/submit-answer")
    public ResponseEntity<?> submitAnswer(
            @RequestParam Long playerId,
            @RequestParam Long questionId,
            @RequestParam String answer,
            @RequestParam long timeTaken) {
        quizService.submitAnswer(playerId, questionId, answer, timeTaken);
        return ResponseEntity.ok("Answer submitted");
    }

    @GetMapping("/leaderboard/{quizId}")
    public List<Player> getLeaderboard(@PathVariable Long quizId) {
        return playerRepository.findByQuizIdOrderByPointsDescTotalResponseTimeAsc(quizId);
    }
}