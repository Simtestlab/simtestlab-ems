export interface WeatherCondition {
  temperature: number; // Celsius
  feelsLike: number;
  humidity: number; // percentage
  cloudCover: number; // percentage
  windSpeed: number; // km/h
  windDirection: string;
  condition: 'clear' | 'partly_cloudy' | 'cloudy' | 'rainy' | 'stormy';
  solarIrradiance: number; // W/m²
  uvIndex: number;
}

export interface WeatherForecast {
  hour: string;
  temperature: number;
  cloudCover: number;
  solarIrradiance: number;
}

export interface Weather {
  location: string;
  city: string;
  state: string;
  timestamp: Date;
  current: WeatherCondition;
  hourlyForecast: WeatherForecast[];
  sunrise: Date;
  sunset: Date;
}
