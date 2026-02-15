// src/api/open-meteo.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { geocodeLocation, fetchForecast } from "./open-meteo";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("geocodeLocation", () => {
  beforeEach(() => mockFetch.mockReset());

  it("returns parsed locations from API response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          { name: "Stockholm", country: "Sweden", latitude: 59.33, longitude: 18.07 },
        ],
      }),
    });
    const results = await geocodeLocation("Stockholm");
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      name: "Stockholm",
      country: "Sweden",
      latitude: 59.33,
      longitude: 18.07,
    });
  });

  it("returns empty array when no results", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    const results = await geocodeLocation("xyznonexistent");
    expect(results).toEqual([]);
  });

  it("throws on API error", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(geocodeLocation("test")).rejects.toThrow("Geocoding failed: 500");
  });
});

describe("fetchForecast", () => {
  beforeEach(() => mockFetch.mockReset());

  it("returns parsed forecast from API response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        daily: {
          time: ["2026-02-15", "2026-02-16"],
          weather_code: [0, 61],
          temperature_2m_max: [5.2, 3.1],
          temperature_2m_min: [-1.0, -2.5],
          precipitation_probability_max: [10, 80],
          wind_speed_10m_max: [15.3, 25.7],
        },
      }),
    });
    const forecast = await fetchForecast(59.33, 18.07);
    expect(forecast).toHaveLength(2);
    expect(forecast[0]).toEqual({
      date: "2026-02-15",
      weatherCode: 0,
      tempMax: 5.2,
      tempMin: -1.0,
      precipitationProbability: 10,
      windSpeedMax: 15.3,
    });
  });

  it("throws on API error", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(fetchForecast(59.33, 18.07)).rejects.toThrow("Forecast failed: 500");
  });
});
