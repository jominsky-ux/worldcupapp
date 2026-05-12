package com.jominsky.worldcupapp.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configures CORS so the React dev server (port 3000) can call this backend
 * without the browser blocking cross-origin requests.
 *
 * In production, set app.cors.allowed-origins to the deployed frontend URL.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    /** Comma-separated list of allowed CORS origins, e.g. http://localhost:3000,https://prod.example.com */
    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    /**
     * Applies CORS rules to every /api/** endpoint.
     * Credentials are allowed so that auth cookies or JWT headers can be included.
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins.split(","))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
