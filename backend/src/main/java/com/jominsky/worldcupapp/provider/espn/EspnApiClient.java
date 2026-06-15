package com.jominsky.worldcupapp.provider.espn;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.fasterxml.jackson.databind.JsonNode;
import com.jominsky.worldcupapp.config.CacheConfig;
import com.jominsky.worldcupapp.dto.TeamDto;

/**
 * Low-level HTTP client for ESPN's unofficial public soccer API.
 *
 * Responsibilities:
 * <ul>
 * <li>Building endpoint URLs from a configurable base URL</li>
 * <li>Executing GET requests and returning raw {@link JsonNode} trees</li>
 * <li>Caching responses so that multiple provider methods sharing an endpoint
 * do not trigger duplicate outbound HTTP calls</li>
 * </ul>
 *
 * ESPN's API is undocumented and unofficial — response shapes may change
 * without notice. All parsing logic lives in {@link EspnWorldCupDataProvider},
 * not here, so a schema change only requires updating one class.
 */
@Component
public class EspnApiClient {

  private static final Logger log = LoggerFactory.getLogger(EspnApiClient.class);

  /** Base URL for scoreboard and match-summary endpoints. */
  @Value("${app.espn.base-url:https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world}")
  private String baseUrl;

  /** Standings uses a different ESPN API path (/apis/v2/ vs /apis/site/v2/). */
  @Value("${app.espn.standings-url:https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings}")
  private String standingsUrl;

  /** Seasons uses a different ESPN API base URL (sports.core.api.espn.com). */
  @Value("${app.espn.seasons-url:https://sports.core.api.espn.com/v2/sports/soccer/leagues/fifa.world/seasons/2026}")
  private String seasonsUrl;

  /** Core API base — used for per-match player statistics. */
  @Value("${app.espn.core-base-url:https://sports.core.api.espn.com/v2/sports/soccer/leagues/fifa.world}")
  private String coreBaseUrl;

  private final RestClient restClient;

  /**
   * Constructs the client with the shared {@link RestClient} bean.
   *
   * @param restClient shared HTTP client configured in RestClientConfig
   */
  public EspnApiClient(RestClient restClient) {
    this.restClient = restClient;
  }

  /**
   * Fetches the standings response from ESPN.
   *
   * The standings endpoint returns both group membership (teams per group)
   * and current W/D/L/Pts statistics, so it powers both getGroups() and
   * getStandings() in the provider without a second HTTP call.
   *
   * @return raw JSON tree from ESPN's standings endpoint
   * @throws RestClientException if the request fails
   */
  @Cacheable(CacheConfig.STANDINGS_CACHE)
  public JsonNode fetchStandings() {
    return get(standingsUrl);
  }

  /**
   * Fetches the scoreboard from ESPN.
   *
   * Returns matches for the current period (typically the current week).
   * To fetch matches for a specific date range, ESPN accepts a {@code dates}
   * query parameter (e.g. {@code ?dates=20260614-20260630}) — add that
   * as a parameter if broader coverage is needed.
   *
   * @return raw JSON tree from ESPN's scoreboard endpoint
   * @throws RestClientException if the request fails
   */
  @Cacheable(CacheConfig.SCOREBOARD_CACHE)
  public JsonNode fetchScoreboard() {
    return get(baseUrl + "/scoreboard");
  }

  /**
   * Fetches the detailed summary for a specific match, including scoring plays.
   *
   * The response contains a {@code scoringPlays} array where each element
   * represents a goal with the scorer and (when available) the assist.
   *
   * @param eventId ESPN's numeric match identifier (from the scoreboard response)
   * @return raw JSON tree from ESPN's summary endpoint
   * @throws RestClientException if the request fails
   */
  @Cacheable(value = CacheConfig.MATCH_SUMMARY_CACHE, key = "#eventId")
  public JsonNode fetchMatchSummary(String eventId) {
    return get(baseUrl + "/summary?event=" + eventId);
  }

  /**
   * Fetches the athletes for a specific team.
   *
   * @param teamId ESPN's numeric team identifier
   * @return raw JSON tree from ESPN's team athletes endpoint
   * @throws RestClientException if the request fails
   */
  @Cacheable(value = CacheConfig.TEAM_CACHE, key = "#team.id()")
  public JsonNode fetchTeamAthletes(TeamDto team) {
    return get(baseUrl + "/teams/" + team.id() + "/roster");
  }

  /**
   * Fetches season-level information, including the current tournament phase
   * and live-match status.
   *
   * This endpoint is separate from the others and uses a different base URL,
   * but it contains critical information for gating pick submissions and showing
   * live indicators in the frontend, so it's included here for convenience.
   *
   * @return raw JSON tree from ESPN's seasons endpoint
   * @throws RestClientException if the request fails
   */
  @Cacheable(CacheConfig.SEASON_CACHE)
  public JsonNode fetchSeason() {
    return get(seasonsUrl);
  }

  /** Fetches all 2026 World Cup events via the site API scoreboard date range. */
  public JsonNode fetchCoreEvents() {
    return get(baseUrl + "/scoreboard?dates=20260611-20261220&limit=200");
  }

  /** Fetches competition data for an event, including competitor IDs and date. */
  public JsonNode fetchCoreCompetition(String eventId) {
    return get(coreBaseUrl + "/events/" + eventId + "/competitions/" + eventId);
  }

  /** Fetches the match roster for one team, providing player IDs. */
  public JsonNode fetchCoreCompetitorRoster(String eventId, String teamId) {
    return get(coreBaseUrl + "/events/" + eventId + "/competitions/" + eventId
            + "/competitors/" + teamId + "/roster");
  }

  /** Fetches per-player match statistics for a single athlete. */
  public JsonNode fetchCorePlayerStats(String eventId, String teamId, String athleteId) {
    return get(coreBaseUrl + "/events/" + eventId + "/competitions/" + eventId
            + "/competitors/" + teamId + "/roster/" + athleteId + "/statistics/0");
  }

  /**
   * Executes a GET request and deserializes the response body as a Jackson
   * {@link JsonNode}.
   * Jackson is on the classpath via spring-boot-starter-web, so the RestClient
   * will use {@code MappingJackson2HttpMessageConverter} automatically.
   *
   * @param url fully-qualified URL to request
   * @return parsed JSON tree
   */
  private JsonNode get(String url) {
    log.debug("ESPN API GET: {}", url);
    return restClient.get()
        .uri(url)
        .retrieve()
        .body(JsonNode.class);
  }
}
