package com.example.demo.controllers;

import com.example.demo.Entities.Quiz;
import com.example.demo.repository.QuizRepository;
import com.example.demo.service.ExcelService;
import com.example.demo.service.QuizService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/quizzes")
@CrossOrigin(origins = "*")
public class QuizController {

    @Autowired
    private QuizService quizService;

    @Autowired
    private ExcelService excelService;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private com.example.demo.repository.PlayerRepository playerRepository;

    @Autowired
    private com.example.demo.service.EmailService emailService;

    @GetMapping
    public List<Quiz> getAllQuizzes() {
        return quizService.getAllQuizzes();
    }

    @PostMapping("/{quizId}/end")
    public ResponseEntity<?> endQuiz(@PathVariable Long quizId) {
        try {
            Quiz quiz = quizRepository.findById(quizId).orElse(null);
            if (quiz == null) {
                return ResponseEntity.notFound().build();
            }

            // Get winner
            var players = playerRepository.findByQuizIdOrderByPointsDescTotalResponseTimeAsc(quizId);
            if (!players.isEmpty()) {
                var winner = players.get(0);
                quiz.setWinnerName(winner.getDisplayName());
                quiz.setWinnerScore(winner.getPoints());
                quiz.setTopScore(winner.getPoints());
                quizRepository.save(quiz);

                // Send email to admin
                try {
                    emailService.sendWinnerEmail(quiz.getCreatorEmail(), winner.getDisplayName(), winner.getPoints());
                } catch (Exception e) {
                    System.out.println("Email sending failed (mail server may not be configured): " + e.getMessage());
                }
            }

            return ResponseEntity.ok("Quiz ended successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error ending quiz: " + e.getMessage());
        }
    }

    // יצירת חידון רגיל
    @PostMapping
    public ResponseEntity<?> createQuiz(@RequestBody Map<String, String> payload) {

        try {

            Quiz quiz = new Quiz();

            Long id = Long.parseLong(payload.get("id"));

            quiz.setId(id);
            quiz.setCode(String.valueOf(id));

            quiz.setTitle(payload.get("title"));

            quiz.setStartTime(
                    LocalDateTime.parse(payload.get("startTime"))
            );

            quiz.setEndTime(
                    LocalDateTime.parse(payload.get("endTime"))
            );

            quiz.setCreatorEmail(payload.get("creatorEmail"));

            quizRepository.save(quiz);

            return ResponseEntity.ok(quiz);

        } catch (Exception e) {

            return ResponseEntity
                    .status(500)
                    .body("Error creating quiz: " + e.getMessage());
        }
    }

    // יצירת חידון עם אקסל
    @PostMapping(value = "/upload", consumes = {"multipart/form-data"})
    public ResponseEntity<?> createFullQuiz(
            @RequestParam("title") String title,
            @RequestParam("id") Long id,
            @RequestParam("startTime") String startTime,
            @RequestParam("endTime") String endTime,
            @RequestParam("timeLimit") Integer timeLimit,
            @RequestParam("creatorEmail") String creatorEmail,
            @RequestParam("file") MultipartFile file
    ) {

        try {

            Quiz quiz = new Quiz();

            quiz.setId(id);

            quiz.setCode(String.valueOf(id));

            quiz.setTitle(title);

            quiz.setStartTime(
                    LocalDateTime.parse(startTime + ":00")
            );

            quiz.setEndTime(
                    LocalDateTime.parse(endTime + ":00")
            );

            quiz.setTimeLimit(timeLimit);

            quiz.setCreatorEmail(creatorEmail);

            quizRepository.save(quiz);

            excelService.importQuestionsFromExcel(file, quiz);

            return ResponseEntity.ok(quiz);

        } catch (Exception e) {

            return ResponseEntity
                    .status(500)
                    .body("Error uploading quiz: " + e.getMessage());
        }
    }
}