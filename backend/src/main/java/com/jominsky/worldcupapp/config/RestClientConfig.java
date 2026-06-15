package com.jominsky.worldcupapp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

/**
 * Produces a shared RestClient bean used by EspnApiClient for outbound HTTP calls.
 *
 * RestClient (Spring 6.1+) is the modern replacement for RestTemplate.
 * A single shared instance is thread-safe and reuses the underlying connection pool.
 */
@Configuration
public class RestClientConfig {

    /**
     * Creates a RestClient pre-configured with JSON accept headers and a
     * descriptive User-Agent so ESPN can identify the caller in their logs.
     */
    @Bean
    public RestClient restClient() {
        return RestClient.builder()
                .defaultHeader("Accept", "application/json")
                .defaultHeader("User-Agent", "Mozilla/5.0 (compatible; WorldCupApp/1.0)")
                .build();
    }
}
