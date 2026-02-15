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
