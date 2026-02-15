# Weather MCP App -- Design Document

**Date:** 2026-02-15
**Status:** Approved

## Summary

An MCP App that renders a 7-day weather forecast inside Claude conversations. Users can ask Claude about the weather for any location, and the app loads with the forecast pre-populated. Users can also search for additional locations or use browser geolocation within the app UI.

## Architecture

**Type:** MCP App (renders in sandboxed iframe inside Claude Desktop / claude.ai)

**Stack:**
- React + TypeScript + Tailwind CSS (UI, bundled into single HTML via Vite)
- Node.js + Express (MCP server)
- `@modelcontextprotocol/sdk` + `@modelcontextprotocol/ext-apps` (MCP protocol)
- Lucide React (icons)
- Open-Meteo API (weather data + geocoding, free, no API key)

**Project location:** `~/Code/mcp-apps/weather/`

## MCP Tools

### `get-weather`
- **Input:** `{ location?: string }` -- city name (e.g. "Stockholm", "Paris, France")
- **Behavior:** Geocodes the city name via Open-Meteo geocoding API, then fetches 7-day daily forecast
- **Output:** `{ location: { name, country, latitude, longitude }, forecast: [{ date, weatherCode, tempMax, tempMin, precipitationProbability, windSpeedMax }] }`
- **UI resource:** Declared via `_meta.ui.resourceUri` -- this is the tool that triggers the app to render
- **No location provided:** Returns a message prompting the user to specify a location; UI shows the search bar

### `search-locations`
- **Input:** `{ query: string }`
- **Behavior:** Calls Open-Meteo geocoding API
- **Output:** `{ results: [{ name, country, latitude, longitude }] }` (max 5 results)
- **Used by:** The app UI for autocomplete (called via `app.callServerTool`)

## UI Design

### Layout
- Search bar at top with autocomplete dropdown and "Use my location" button
- 7-day forecast displayed as a horizontal card grid (responsive, wraps on narrow viewports)
- Each card: day name, Lucide weather icon, high/low temperature, precipitation %, wind speed

### Data Flow
1. Claude calls `get-weather` with location extracted from conversation
2. Tool result pushed to UI via `app.ontoolresult` -- forecast renders immediately
3. User can search for new location in the UI -- triggers `search-locations` then `get-weather` via `app.callServerTool`
4. "Use my location" button attempts browser geolocation; on failure, shows toast message

### Theme
- Uses MCP Apps host theme integration: `app.getHostContext()` for initial theme, `app.onhostcontextchanged` for dynamic updates
- Host provides CSS custom properties (`--color-background-primary`, `--color-text-primary`, etc.)
- `applyDocumentTheme()` and `applyHostStyleVariables()` from the SDK
- Tailwind `dark:` variants keyed off host theme class

### Icons
- Lucide React (tree-shakeable, React-native SVG components)
- WMO weather codes mapped to Lucide icons: Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, CloudFog, CloudSun, CloudSunRain, Wind, CloudHail, CloudRainWind

### Error Handling
- Network errors: inline message with retry button
- Empty search results: "No locations found"
- Geolocation denied/unavailable: toast with fallback suggestion
- Loading states: skeleton/shimmer (no blocking spinners)

## Project Structure

```
~/Code/mcp-apps/weather/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── server.ts
├── mcp-app.html
├── docs/plans/
└── src/
    ├── mcp-app.tsx
    ├── components/
    │   ├── SearchBar.tsx
    │   ├── ForecastGrid.tsx
    │   └── ForecastCard.tsx
    ├── types.ts
    └── utils/
        ├── weather-codes.ts
        └── theme.ts
```

## External Dependencies

- **Open-Meteo Forecast API:** `https://api.open-meteo.com/v1/forecast` -- no key needed
- **Open-Meteo Geocoding API:** `https://geocoding-api.open-meteo.com/v1/search` -- no key needed

## Testing

- Build and serve locally: `npm run build && npm run serve`
- Test with `ext-apps` basic-host, or via cloudflared tunnel to Claude Desktop / claude.ai
