package com.example.demo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // מגדיר לשרת שכל מה שנמצא בתיקיית static בתוך resources הוא נגיש
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/");
    }
}