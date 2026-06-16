package com.example.demo;

import com.example.demo.Entities.Quiz;
import com.example.demo.service.ExcelService;
import com.example.demo.service.QuizService;
import com.example.demo.service.SseService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class DemoApplication {

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}
//    @Bean
//    CommandLineRunner initData(QuizService quizService, ExcelService excelService) {
//        return args -> {
//            // יצירת המבחן
//            Quiz q = new Quiz();
//            q.setName("מבחן מאקסל");
//            quizService.createQuiz(q);
//
//            // טעינת השאלות מההורדות
//            String path = "C:\\Users\\brw29\\Downloads\\A.xlsx";
//            excelService.importQuestionsFromExcel(path, q);
//        };
        @Bean
        CommandLineRunner testSse(SseService sseService) {
            return args -> {
                new Thread(() -> {
                    while (true) {
                        try {
                            Thread.sleep(5000);
                            sseService.sendToAll("gameUpdate", "שחקן חדש הצטרף למשחק! " + System.currentTimeMillis());
                        } catch (Exception e) { e.printStackTrace(); }
                    }
                }).start();
            };
        }
    }


