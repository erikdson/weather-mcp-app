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
