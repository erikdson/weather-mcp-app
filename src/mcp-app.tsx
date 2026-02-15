// src/mcp-app.tsx
import { StrictMode, useState, useCallback, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@modelcontextprotocol/ext-apps";
import {
  applyDocumentTheme,
  applyHostStyleVariables,
  applyHostFonts,
} from "@modelcontextprotocol/ext-apps";
import "./global.css";
import { SearchBar } from "./components/SearchBar";
import { ForecastGrid } from "./components/ForecastGrid";
import type { WeatherResponse, Location } from "./types";
import { CloudSun } from "lucide-react";

function applyHostContext(ctx: any) {
  if (ctx?.theme) applyDocumentTheme(ctx.theme);
  if (ctx?.styles?.variables) applyHostStyleVariables(ctx.styles.variables);
  if (ctx?.styles?.css?.fonts) applyHostFonts(ctx.styles.css.fonts);
}

function parseWeatherResult(text: string): {
  weather?: WeatherResponse;
  error?: string;
} {
  try {
    const data = JSON.parse(text);
    if (data.error === "no_location") return {};
    if (data.error === "not_found")
      return { error: `Location "${data.query}" not found` };
    if (data.error === "fetch_failed")
      return { error: `Failed to fetch weather: ${data.message}` };
    if (data.error) return { error: data.error };
    if (data.location && data.forecast) return { weather: data };
    return {};
  } catch {
    return { error: "Failed to parse weather data" };
  }
}

function WeatherApp() {
  const appRef = useRef<App | null>(null);
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const app = new App({ name: "Weather Forecast", version: "1.0.0" });
    appRef.current = app;

    app.ontoolresult = (result: any) => {
      const text = result.content?.find(
        (c: any) => c.type === "text",
      )?.text;
      if (!text) return;
      const { weather: w, error: e } = parseWeatherResult(text);
      if (w) {
        setWeather(w);
        setError(null);
      }
      if (e) setError(e);
    };

    app.onhostcontextchanged = (ctx: any) => applyHostContext(ctx);

    app.connect().then(() => {
      const ctx = app.getHostContext();
      if (ctx) applyHostContext(ctx);
    });

    return () => {
      appRef.current = null;
    };
  }, []);

  const handleLocationSelect = useCallback(async (location: Location) => {
    const app = appRef.current;
    if (!app) return;
    setLoading(true);
    setError(null);
    try {
      const result = await app.callServerTool({
        name: "get-weather",
        arguments: {
          location: location.name,
          latitude: location.latitude,
          longitude: location.longitude,
        },
      });
      const text = result.content?.find(
        (c: any) => c.type === "text",
      )?.text;
      if (text) {
        const { weather: w, error: e } = parseWeatherResult(text);
        if (w) {
          setWeather(w);
          setError(null);
        }
        if (e) setError(e);
      }
    } catch {
      setError("Failed to fetch weather data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <SearchBar app={appRef.current} onLocationSelect={handleLocationSelect} />

      {error && (
        <div
          className="mt-4 p-3 rounded-xl text-sm"
          style={{
            background: "light-dark(#fef2f2, #450a0a)",
            color: "light-dark(#dc2626, #fca5a5)",
            border: "1px solid light-dark(#fecaca, #7f1d1d)",
          }}
        >
          {error}
        </div>
      )}

      {loading && (
        <div
          className="mt-6 flex justify-center"
          style={{ color: "var(--text-secondary)" }}
        >
          <div className="animate-pulse text-sm">Loading forecast...</div>
        </div>
      )}

      {weather && !loading && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3">
            {weather.location.name}
            {weather.location.country && (
              <span
                className="font-normal ml-1"
                style={{ color: "var(--text-secondary)" }}
              >
                {weather.location.country}
              </span>
            )}
          </h2>
          <ForecastGrid forecast={weather.forecast} />
        </div>
      )}

      {!weather && !loading && !error && (
        <div
          className="mt-12 flex flex-col items-center gap-3"
          style={{ color: "var(--text-secondary)" }}
        >
          <CloudSun size={48} />
          <p className="text-sm">
            Search for a city or use your location to see the forecast.
          </p>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WeatherApp />
  </StrictMode>,
);
