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
