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
