# Weather MCP App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an MCP App that renders a 7-day weather forecast inside Claude conversations, with search and geolocation support.

**Architecture:** MCP server (Node.js + Express) exposes `get-weather` and `search-locations` tools backed by the Open-Meteo API. A React + Tailwind UI is bundled into a single HTML file via Vite and rendered in Claude's sandboxed iframe. Theme adapts to the host via `@modelcontextprotocol/ext-apps` utilities.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Vite, Lucide React, @modelcontextprotocol/sdk, @modelcontextprotocol/ext-apps, Express, Vitest

**Design doc:** `docs/plans/2026-02-15-weather-mcp-app-design.md`

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `.gitignore`

**Step 1: Create `package.json`**

```json
{
  "name": "weather-mcp-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "INPUT=mcp-app.html vite build",
    "dev": "concurrently \"INPUT=mcp-app.html vite build --watch\" \"tsx --watch main.ts\"",
    "serve": "tsx main.ts",
    "start": "npm run build && npm run serve",
    "test": "vitest run"
  },
  "dependencies": {
    "@modelcontextprotocol/ext-apps": "^1.0.0",
    "@modelcontextprotocol/sdk": "^1.12.0",
    "cors": "^2.8.5",
    "express": "^4.21.0",
    "lucide-react": "^0.460.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "concurrently": "^9.0.0",
    "tailwindcss": "^4.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0",
    "vite-plugin-singlefile": "^2.0.0",
    "vitest": "^2.0.0"
  }
}
```

**Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "*.ts"]
}
```

**Step 3: Create `vite.config.ts`**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: {
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: process.env.INPUT,
    },
  },
});
```

**Step 4: Create `.gitignore`**

```
node_modules/
dist/
*.tsbuildinfo
```

**Step 5: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, `package-lock.json` generated

**Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts .gitignore
git commit -m "chore: scaffold project with dependencies"
```

---

### Task 2: Shared types and weather code mapping

**Files:**
- Create: `src/types.ts`
- Create: `src/utils/weather-codes.ts`
- Create: `src/utils/weather-codes.test.ts`

**Step 1: Create `src/types.ts`**

```typescript
export interface Location {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface DayForecast {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationProbability: number;
  windSpeedMax: number;
}

export interface WeatherResponse {
  location: Location;
  forecast: DayForecast[];
}
```

**Step 2: Create `src/utils/weather-codes.ts`**

Maps WMO weather interpretation codes to Lucide icons and human-readable labels.

```typescript
import type { LucideIcon } from "lucide-react";
import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudRainWind,
  CloudLightning,
  CloudHail,
} from "lucide-react";

interface WeatherInfo {
  icon: LucideIcon;
  label: string;
}

const weatherCodeMap: Record<number, WeatherInfo> = {
  0: { icon: Sun, label: "Clear sky" },
  1: { icon: Sun, label: "Mainly clear" },
  2: { icon: CloudSun, label: "Partly cloudy" },
  3: { icon: Cloud, label: "Overcast" },
  45: { icon: CloudFog, label: "Fog" },
  48: { icon: CloudFog, label: "Depositing rime fog" },
  51: { icon: CloudDrizzle, label: "Light drizzle" },
  53: { icon: CloudDrizzle, label: "Moderate drizzle" },
  55: { icon: CloudDrizzle, label: "Dense drizzle" },
  56: { icon: CloudDrizzle, label: "Light freezing drizzle" },
  57: { icon: CloudDrizzle, label: "Dense freezing drizzle" },
  61: { icon: CloudRain, label: "Slight rain" },
  63: { icon: CloudRain, label: "Moderate rain" },
  65: { icon: CloudRain, label: "Heavy rain" },
  66: { icon: CloudRain, label: "Light freezing rain" },
  67: { icon: CloudRain, label: "Heavy freezing rain" },
  71: { icon: CloudSnow, label: "Slight snow" },
  73: { icon: CloudSnow, label: "Moderate snow" },
  75: { icon: CloudSnow, label: "Heavy snow" },
  77: { icon: CloudSnow, label: "Snow grains" },
  80: { icon: CloudRainWind, label: "Slight rain showers" },
  81: { icon: CloudRainWind, label: "Moderate rain showers" },
  82: { icon: CloudRainWind, label: "Violent rain showers" },
  85: { icon: CloudSnow, label: "Slight snow showers" },
  86: { icon: CloudSnow, label: "Heavy snow showers" },
  95: { icon: CloudLightning, label: "Thunderstorm" },
  96: { icon: CloudHail, label: "Thunderstorm with slight hail" },
  99: { icon: CloudHail, label: "Thunderstorm with heavy hail" },
};

export function getWeatherInfo(code: number): WeatherInfo {
  return weatherCodeMap[code] ?? { icon: Cloud, label: "Unknown" };
}
```

**Step 3: Write test for weather code mapping**

```typescript
// src/utils/weather-codes.test.ts
import { describe, it, expect } from "vitest";
import { getWeatherInfo } from "./weather-codes";
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning } from "lucide-react";

describe("getWeatherInfo", () => {
  it("returns Sun for clear sky (code 0)", () => {
    const info = getWeatherInfo(0);
    expect(info.icon).toBe(Sun);
    expect(info.label).toBe("Clear sky");
  });

  it("returns Cloud for overcast (code 3)", () => {
    const info = getWeatherInfo(3);
    expect(info.icon).toBe(Cloud);
    expect(info.label).toBe("Overcast");
  });

  it("returns CloudRain for moderate rain (code 63)", () => {
    const info = getWeatherInfo(63);
    expect(info.icon).toBe(CloudRain);
    expect(info.label).toBe("Moderate rain");
  });

  it("returns CloudSnow for heavy snow (code 75)", () => {
    const info = getWeatherInfo(75);
    expect(info.icon).toBe(CloudSnow);
    expect(info.label).toBe("Heavy snow");
  });

  it("returns CloudLightning for thunderstorm (code 95)", () => {
    const info = getWeatherInfo(95);
    expect(info.icon).toBe(CloudLightning);
    expect(info.label).toBe("Thunderstorm");
  });

  it("returns Cloud with Unknown for unrecognized codes", () => {
    const info = getWeatherInfo(999);
    expect(info.icon).toBe(Cloud);
    expect(info.label).toBe("Unknown");
  });
});
```

**Step 4: Run tests**

Run: `npx vitest run src/utils/weather-codes.test.ts`
Expected: All 6 tests pass

**Step 5: Commit**

```bash
git add src/types.ts src/utils/weather-codes.ts src/utils/weather-codes.test.ts
git commit -m "feat: add shared types and weather code mapping"
```

---

### Task 3: Open-Meteo API functions

**Files:**
- Create: `src/api/open-meteo.ts`
- Create: `src/api/open-meteo.test.ts`

**Step 1: Write test for API functions**

```typescript
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
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/api/open-meteo.test.ts`
Expected: FAIL -- module `./open-meteo` not found

**Step 3: Implement API functions**

```typescript
// src/api/open-meteo.ts
import type { Location, DayForecast } from "../types.js";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export async function geocodeLocation(query: string): Promise<Location[]> {
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=5&language=en`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
  const data = await res.json();
  if (!data.results) return [];
  return data.results.map((r: any) => ({
    name: r.name,
    country: r.country,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

export async function fetchForecast(lat: number, lon: number): Promise<DayForecast[]> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",
    timezone: "auto",
  });
  const res = await fetch(`${FORECAST_URL}?${params}`);
  if (!res.ok) throw new Error(`Forecast failed: ${res.status}`);
  const data = await res.json();
  const daily = data.daily;
  return daily.time.map((date: string, i: number) => ({
    date,
    weatherCode: daily.weather_code[i],
    tempMax: daily.temperature_2m_max[i],
    tempMin: daily.temperature_2m_min[i],
    precipitationProbability: daily.precipitation_probability_max[i],
    windSpeedMax: daily.wind_speed_10m_max[i],
  }));
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/api/open-meteo.test.ts`
Expected: All 5 tests pass

**Step 5: Commit**

```bash
git add src/api/open-meteo.ts src/api/open-meteo.test.ts
git commit -m "feat: add Open-Meteo geocoding and forecast API functions"
```

---

### Task 4: MCP server (tool + resource registration)

**Files:**
- Create: `server.ts`

**Step 1: Implement MCP server**

The `get-weather` tool accepts either a `location` string (city name, used by Claude) or `latitude`/`longitude` (used by the UI when it already has coordinates from search). The `search-locations` tool is used by the UI for autocomplete.

```typescript
// server.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import fs from "node:fs/promises";
import path from "node:path";
import { geocodeLocation, fetchForecast } from "./src/api/open-meteo.js";

const RESOURCE_URI = "ui://weather/mcp-app.html";

export function createServer() {
  const server = new McpServer({
    name: "Weather MCP App",
    version: "1.0.0",
  });

  registerAppTool(
    server,
    "get-weather",
    {
      title: "Get Weather Forecast",
      description:
        "Returns a 7-day weather forecast for a location. Accepts a city name (e.g. 'Stockholm') or latitude/longitude coordinates.",
      inputSchema: {
        type: "object" as const,
        properties: {
          location: {
            type: "string",
            description: "City name to get weather for",
          },
          latitude: {
            type: "number",
            description: "Latitude (use with longitude to skip geocoding)",
          },
          longitude: {
            type: "number",
            description: "Longitude (use with latitude to skip geocoding)",
          },
        },
      },
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async ({
      location,
      latitude,
      longitude,
    }: {
      location?: string;
      latitude?: number;
      longitude?: number;
    }) => {
      try {
        let loc;

        if (latitude !== undefined && longitude !== undefined) {
          loc = {
            name: location || "Selected location",
            country: "",
            latitude,
            longitude,
          };
        } else if (location) {
          const results = await geocodeLocation(location);
          if (results.length === 0) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify({
                    error: "not_found",
                    query: location,
                  }),
                },
              ],
            };
          }
          loc = results[0];
        } else {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ error: "no_location" }),
              },
            ],
          };
        }

        const forecast = await fetchForecast(loc.latitude, loc.longitude);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ location: loc, forecast }),
            },
          ],
        };
      } catch (err: any) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error: "fetch_failed",
                message: err.message,
              }),
            },
          ],
        };
      }
    },
  );

  registerAppTool(
    server,
    "search-locations",
    {
      title: "Search Locations",
      description: "Search for locations by name for weather lookup.",
      inputSchema: {
        type: "object" as const,
        properties: {
          query: {
            type: "string",
            description: "City name to search for",
          },
        },
        required: ["query"],
      },
    },
    async ({ query }: { query: string }) => {
      try {
        const results = await geocodeLocation(query);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify({ results }) },
          ],
        };
      } catch (err: any) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ results: [], error: err.message }),
            },
          ],
        };
      }
    },
  );

  registerAppResource(
    server,
    RESOURCE_URI,
    RESOURCE_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => {
      const html = await fs.readFile(
        path.join(import.meta.dirname, "dist", "mcp-app.html"),
        "utf-8",
      );
      return {
        contents: [
          { uri: RESOURCE_URI, mimeType: RESOURCE_MIME_TYPE, text: html },
        ],
      };
    },
  );

  return server;
}
```

**Step 2: Commit**

```bash
git add server.ts
git commit -m "feat: add MCP server with get-weather and search-locations tools"
```

---

### Task 5: HTTP entry point

**Files:**
- Create: `main.ts`

**Step 1: Implement Express HTTP server**

```typescript
// main.ts
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import cors from "cors";
import express from "express";
import { createServer } from "./server.js";

const PORT = parseInt(process.env.PORT || "3001");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/mcp", async (req, res) => {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  res.on("close", () => transport.close());
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.listen(PORT, () => {
  console.log(
    `Weather MCP App server running at http://localhost:${PORT}/mcp`,
  );
});
```

**Step 2: Commit**

```bash
git add main.ts
git commit -m "feat: add Express HTTP entry point for MCP server"
```

---

### Task 6: UI -- global CSS and theme

**Files:**
- Create: `src/global.css`

**Step 1: Create global CSS with host variable fallbacks**

Uses CSS `light-dark()` function for automatic light/dark support. Host-provided CSS variables override these defaults automatically.

```css
/* src/global.css */
@import "tailwindcss";

:root {
  color-scheme: light dark;

  /* Colors -- host variables override via applyHostStyleVariables() */
  --bg-primary: var(--color-background-primary, light-dark(#ffffff, #0f172a));
  --bg-secondary: var(
    --color-background-secondary,
    light-dark(#f8fafc, #1e293b)
  );
  --bg-card: light-dark(#ffffff, #1e293b);
  --bg-card-hover: light-dark(#f8fafc, #334155);
  --text-primary: var(--color-text-primary, light-dark(#0f172a, #f1f5f9));
  --text-secondary: var(--color-text-secondary, light-dark(#64748b, #94a3b8));
  --border-color: light-dark(#e2e8f0, #334155);
  --accent: var(--color-accent, #3b82f6);
  --accent-hover: light-dark(#2563eb, #60a5fa);
  --ring: var(--color-ring-primary, #3b82f6);

  /* Typography */
  --font-sans: var(
    --font-sans,
    system-ui,
    -apple-system,
    "Segoe UI",
    Roboto,
    sans-serif
  );
}

body {
  margin: 0;
  padding: 0;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

* {
  box-sizing: border-box;
}
```

**Step 2: Commit**

```bash
git add src/global.css
git commit -m "feat: add global CSS with host theme variable fallbacks"
```

---

### Task 7: UI -- ForecastCard component

**Files:**
- Create: `src/components/ForecastCard.tsx`

**Step 1: Implement ForecastCard**

```tsx
// src/components/ForecastCard.tsx
import { Droplets, Wind } from "lucide-react";
import { getWeatherInfo } from "../utils/weather-codes";
import type { DayForecast } from "../types";

export function ForecastCard({ day }: { day: DayForecast }) {
  const { icon: WeatherIcon, label } = getWeatherInfo(day.weatherCode);
  const date = new Date(day.date + "T00:00:00");
  const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className="flex flex-col items-center gap-1.5 rounded-xl p-3 min-w-[110px] transition-colors"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
      }}
    >
      <span
        className="text-xs font-semibold uppercase tracking-wide"
        style={{ color: "var(--text-secondary)" }}
      >
        {dayName}
      </span>
      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
        {dateStr}
      </span>
      <WeatherIcon size={30} style={{ color: "var(--accent)" }} />
      <span
        className="text-xs text-center leading-tight"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </span>
      <div className="flex gap-1.5 text-sm font-semibold">
        <span>{Math.round(day.tempMax)}°</span>
        <span style={{ color: "var(--text-secondary)" }}>
          {Math.round(day.tempMin)}°
        </span>
      </div>
      <div
        className="flex items-center gap-1 text-xs"
        style={{ color: "var(--text-secondary)" }}
      >
        <Droplets size={12} />
        <span>{day.precipitationProbability}%</span>
      </div>
      <div
        className="flex items-center gap-1 text-xs"
        style={{ color: "var(--text-secondary)" }}
      >
        <Wind size={12} />
        <span>{Math.round(day.windSpeedMax)} km/h</span>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/ForecastCard.tsx
git commit -m "feat: add ForecastCard component with Lucide icons"
```

---

### Task 8: UI -- ForecastGrid component

**Files:**
- Create: `src/components/ForecastGrid.tsx`

**Step 1: Implement ForecastGrid**

Horizontal scrolling row that works in constrained iframe widths.

```tsx
// src/components/ForecastGrid.tsx
import { ForecastCard } from "./ForecastCard";
import type { DayForecast } from "../types";

export function ForecastGrid({ forecast }: { forecast: DayForecast[] }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {forecast.map((day) => (
        <ForecastCard key={day.date} day={day} />
      ))}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/ForecastGrid.tsx
git commit -m "feat: add ForecastGrid component"
```

---

### Task 9: UI -- SearchBar component

**Files:**
- Create: `src/components/SearchBar.tsx`

**Step 1: Implement SearchBar with autocomplete and geolocation**

The SearchBar calls `search-locations` via `app.callServerTool()` for autocomplete, debounced at 300ms. The geolocation button uses the browser's Geolocation API with a graceful fallback.

```tsx
// src/components/SearchBar.tsx
import { useState, useRef, useEffect } from "react";
import { Search, MapPin, X } from "lucide-react";
import type { App } from "@modelcontextprotocol/ext-apps";
import type { Location } from "../types";

interface SearchBarProps {
  app: App | null;
  onLocationSelect: (location: Location) => void;
}

export function SearchBar({ app, onLocationSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Location[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInput = (value: string) => {
    setQuery(value);
    setGeoError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      if (!app) return;
      setSearching(true);
      try {
        const result = await app.callServerTool({
          name: "search-locations",
          arguments: { query: value },
        });
        const text = result.content?.find(
          (c: any) => c.type === "text",
        )?.text;
        if (text) {
          const data = JSON.parse(text);
          setResults(data.results || []);
          setShowDropdown((data.results || []).length > 0);
        }
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSelect = (loc: Location) => {
    setQuery(`${loc.name}, ${loc.country}`);
    setShowDropdown(false);
    onLocationSelect(loc);
  };

  const handleGeolocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Geolocation not available. Try searching instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocationSelect({
          name: "Current Location",
          country: "",
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setQuery("Current Location");
        setShowDropdown(false);
      },
      () => {
        setGeoError("Location access denied. Try searching instead.");
      },
    );
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex gap-2">
        <div
          className="relative flex-1"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "0.75rem",
          }}
        >
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-secondary)" }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="Search for a city..."
            className="w-full py-2.5 pl-9 pr-8 bg-transparent outline-none text-sm"
            style={{ color: "var(--text-primary)" }}
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:opacity-70"
              style={{ color: "var(--text-secondary)" }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={handleGeolocation}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium shrink-0 hover:opacity-90 transition-opacity"
          style={{
            background: "var(--accent)",
            color: "#ffffff",
          }}
        >
          <MapPin size={16} />
          <span className="hidden sm:inline">My location</span>
        </button>
      </div>

      {geoError && (
        <p className="mt-2 text-xs" style={{ color: "#ef4444" }}>
          {geoError}
        </p>
      )}

      {showDropdown && results.length > 0 && (
        <ul
          className="absolute z-10 w-full mt-1 rounded-xl overflow-hidden shadow-lg"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
          }}
        >
          {results.map((loc, i) => (
            <li
              key={`${loc.latitude}-${loc.longitude}-${i}`}
              onClick={() => handleSelect(loc)}
              className="px-4 py-2.5 cursor-pointer text-sm transition-colors"
              style={{ borderBottom: "1px solid var(--border-color)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--bg-card-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span style={{ color: "var(--text-primary)" }}>{loc.name}</span>
              {loc.country && (
                <span
                  className="ml-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {loc.country}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/SearchBar.tsx
git commit -m "feat: add SearchBar with autocomplete and geolocation"
```

---

### Task 10: UI -- App root (React entry + MCP App wiring)

**Files:**
- Create: `mcp-app.html`
- Create: `src/mcp-app.tsx`

**Step 1: Create `mcp-app.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Weather Forecast</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/mcp-app.tsx"></script>
  </body>
</html>
```

**Step 2: Create `src/mcp-app.tsx`**

This is the main entry point. It:
1. Creates the MCP `App` instance and connects to the host
2. Handles initial tool results from Claude (weather data pre-loaded from conversation)
3. Applies host theme on init and on changes
4. Wires up SearchBar and ForecastGrid

```tsx
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
```

**Step 3: Commit**

```bash
git add mcp-app.html src/mcp-app.tsx
git commit -m "feat: add React app root with MCP App wiring and theme support"
```

---

### Task 11: Build, test, and verify

**Step 1: Run unit tests**

Run: `npx vitest run`
Expected: All tests pass (weather codes + API functions)

**Step 2: Build the UI**

Run: `npm run build`
Expected: `dist/mcp-app.html` created (single file with all JS/CSS inlined)

**Step 3: Start the server**

Run: `npm run serve`
Expected: `Weather MCP App server running at http://localhost:3001/mcp`

**Step 4: Test with basic-host (optional)**

In a separate terminal, clone and run the ext-apps basic-host:

```bash
git clone https://github.com/modelcontextprotocol/ext-apps.git /tmp/ext-apps
cd /tmp/ext-apps/examples/basic-host
npm install
SERVERS='["http://localhost:3001/mcp"]' npm start
```

Open `http://localhost:8080`, select the `get-weather` tool, enter `{"location": "Stockholm"}`, call it. The weather UI should render in the iframe.

**Step 5: Test with Claude Desktop (optional)**

In a separate terminal:
```bash
npx cloudflared tunnel --url http://localhost:3001
```
Copy the URL, add as custom connector in Claude Desktop (Settings > Connectors > Add custom connector), start a new chat and ask "What's the weather in Stockholm?"

**Step 6: Fix any issues, final commit**

```bash
git add -A
git commit -m "chore: build verification and fixes"
```

---

## Notes

- **Docs reference:** MCP Apps spec at https://modelcontextprotocol.io/docs/extensions/apps
- **ext-apps repo:** https://github.com/modelcontextprotocol/ext-apps (examples, basic-host for testing)
- **Open-Meteo forecast API:** `https://api.open-meteo.com/v1/forecast?latitude=X&longitude=Y&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=auto`
- **Open-Meteo geocoding API:** `https://geocoding-api.open-meteo.com/v1/search?name=QUERY&count=5&language=en`
- **Theme imports:** `applyDocumentTheme`, `applyHostStyleVariables`, `applyHostFonts` are all imported from `@modelcontextprotocol/ext-apps`
- **If `applyDocumentTheme` etc. are not exported from `@modelcontextprotocol/ext-apps`**: check the package exports and look for a `/browser` sub-path, or implement manually by setting `document.documentElement.dataset.theme` and applying CSS variables via `document.documentElement.style.setProperty()`
