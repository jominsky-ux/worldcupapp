package com.jominsky.worldcupapp.config;

import java.util.List;
import java.util.concurrent.TimeUnit;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.github.benmanes.caffeine.cache.Caffeine;

/**
 * Configures Caffeine in-memory caches with per-cache TTLs tailored to how
 * frequently each piece of data changes during a live tournament.
 *
 * All caching happens in EspnApiClient so that multiple provider methods
 * that call the same ESPN endpoint share a single cached response.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /** Cache name constants – referenced in @Cacheable annotations. */
    public static final String STANDINGS_CACHE = "standings";
    public static final String SCOREBOARD_CACHE = "scoreboard";
    public static final String MATCH_SUMMARY_CACHE = "matchSummary";
    public static final String TEAM_CACHE = "teams";
    public static final String SEASON_CACHE = "season";

    // ------- TTL constants (minutes) -------

    /** Group standings only change after a match completes. */
    private static final long STANDINGS_TTL_MINUTES = 5;

    /** Scoreboard must reflect live score changes. */
    private static final long SCOREBOARD_TTL_MINUTES = 1;

    /**
     * Match summaries are stable once a match ends; refresh occasionally for late
     * ESPN updates.
     */
    private static final long MATCH_SUMMARY_TTL_MINUTES = 5;

    /** Team data is static, but cache it for a day to avoid unnecessary calls. */
    private static final long TEAM_TTL_MINUTES = 1440; // 24 hours

    // ------- Maximum entry counts -------

    /** 12 groups – small upper bound with headroom. */
    private static final long STANDINGS_MAX_SIZE = 50;

    /** One entry per match; 104 total in the 2026 tournament. */
    private static final long SCOREBOARD_MAX_SIZE = 150;

    /** One entry per match event ID. */
    private static final long MATCH_SUMMARY_MAX_SIZE = 200;

    /** 48 teams - small upper bound with headroom. */
    private static final long TEAM_MAX_SIZE = 50;

    /**
     * Season data is relatively static, but cache it for a day to avoid unnecessary
     * calls.
     */
    private static final long SEASON_TTL_MINUTES = 1440; // 24 hours
    private static final long SEASON_MAX_SIZE = 1;

    /**
     * Creates a SimpleCacheManager with named Caffeine caches.
     * Each cache uses its own TTL and size limit to balance freshness
     * against outbound call volume to the ESPN API.
     */
    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager manager = new SimpleCacheManager();
        manager.setCaches(List.of(

                new CaffeineCache(STANDINGS_CACHE,
                        Caffeine.newBuilder()
                                .expireAfterWrite(STANDINGS_TTL_MINUTES, TimeUnit.MINUTES)
                                .maximumSize(STANDINGS_MAX_SIZE)
                                .build()),

                new CaffeineCache(SCOREBOARD_CACHE,
                        Caffeine.newBuilder()
                                .expireAfterWrite(SCOREBOARD_TTL_MINUTES, TimeUnit.MINUTES)
                                .maximumSize(SCOREBOARD_MAX_SIZE)
                                .build()),

                new CaffeineCache(MATCH_SUMMARY_CACHE,
                        Caffeine.newBuilder()
                                .expireAfterWrite(MATCH_SUMMARY_TTL_MINUTES, TimeUnit.MINUTES)
                                .maximumSize(MATCH_SUMMARY_MAX_SIZE)
                                .build()),

                new CaffeineCache(TEAM_CACHE,
                        Caffeine.newBuilder()
                                .expireAfterWrite(TEAM_TTL_MINUTES, TimeUnit.MINUTES)
                                .maximumSize(TEAM_MAX_SIZE)
                                .build()),

                new CaffeineCache(SEASON_CACHE,
                        Caffeine.newBuilder()
                                .expireAfterWrite(SEASON_TTL_MINUTES, TimeUnit.MINUTES)
                                .maximumSize(SEASON_MAX_SIZE)
                                .build())));
        return manager;
    }
}
