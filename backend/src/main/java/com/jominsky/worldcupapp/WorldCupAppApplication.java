package com.jominsky.worldcupapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the World Cup App backend.
 *
 * Exposes REST endpoints under /api that the React frontend consumes for
 * live tournament data (groups, standings, match scores, goals/assists).
 * Caching is enabled in CacheConfig to limit outbound calls to ESPN.
 */
@SpringBootApplication
public class WorldCupAppApplication {

    public static void main(String[] args) {
        SpringApplication.run(WorldCupAppApplication.class, args);
    }
}
