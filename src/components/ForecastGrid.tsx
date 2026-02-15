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
