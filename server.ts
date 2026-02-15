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
