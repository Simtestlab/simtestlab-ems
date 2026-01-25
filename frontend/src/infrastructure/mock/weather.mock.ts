import { Weather, WeatherCondition, WeatherForecast } from '@/domain/entities/weather.entity';

// Weather data for Indian cities based on site locations
const CITY_WEATHER_PATTERNS = {
  'Chennai': { baseTemp: 30, humidity: 75, windSpeed: 15 },
  'Bangalore': { baseTemp: 25, humidity: 60, windSpeed: 12 },
  'Hyderabad': { baseTemp: 32, humidity: 50, windSpeed: 18 },
  'Mumbai': { baseTemp: 28, humidity: 80, windSpeed: 20 },
  'Ahmedabad': { baseTemp: 35, humidity: 40, windSpeed: 15 },
  'Coimbatore': { baseTemp: 28, humidity: 65, windSpeed: 10 },
};

function getCondition(cloudCover: number, hour: number): WeatherCondition['condition'] {
  if (hour < 6 || hour > 19) return 'clear'; // Night
  if (cloudCover < 20) return 'clear';
  if (cloudCover < 50) return 'partly_cloudy';
  if (cloudCover < 80) return 'cloudy';
  return 'rainy';
}

function calculateSolarIrradiance(hour: number, cloudCover: number): number {
  // Peak solar irradiance around noon
  if (hour < 6 || hour > 19) return 0; // Night
  
  const hourAngle = (hour - 12) / 6; // -1 to +1, peak at noon
  const baseIrradiance = 1000 * Math.cos(hourAngle * Math.PI / 2);
  
  // Cloud cover reduces irradiance
  const cloudFactor = 1 - (cloudCover / 100) * 0.7;
  
  return Math.max(0, baseIrradiance * cloudFactor);
}

export function generateWeatherForCity(city: string, state: string): Weather {
  const pattern = CITY_WEATHER_PATTERNS[city as keyof typeof CITY_WEATHER_PATTERNS] || 
                  CITY_WEATHER_PATTERNS['Chennai'];
  
  const now = new Date();
  const currentHour = now.getHours();
  
  // Add some randomness
  const tempVariation = (Math.random() - 0.5) * 6;
  const cloudCover = Math.max(0, Math.min(100, 30 + Math.random() * 40));
  
  const temperature = pattern.baseTemp + tempVariation;
  const feelsLike = temperature + (pattern.humidity > 70 ? 3 : 0);
  
  const current: WeatherCondition = {
    temperature: Math.round(temperature * 10) / 10,
    feelsLike: Math.round(feelsLike * 10) / 10,
    humidity: pattern.humidity + Math.round((Math.random() - 0.5) * 20),
    cloudCover: Math.round(cloudCover),
    windSpeed: pattern.windSpeed + Math.round((Math.random() - 0.5) * 8),
    windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
    condition: getCondition(cloudCover, currentHour),
    solarIrradiance: Math.round(calculateSolarIrradiance(currentHour, cloudCover)),
    uvIndex: currentHour >= 6 && currentHour <= 19 ? Math.min(11, Math.round((1 - cloudCover / 100) * 8 + 3)) : 0,
  };

  // Generate hourly forecast for next 12 hours
  const hourlyForecast: WeatherForecast[] = [];
  for (let i = 1; i <= 12; i++) {
    const forecastHour = (currentHour + i) % 24;
    const forecastCloudCover = Math.max(0, Math.min(100, cloudCover + (Math.random() - 0.5) * 30));
    const forecastTemp = pattern.baseTemp + (Math.random() - 0.5) * 6;
    
    hourlyForecast.push({
      hour: `${forecastHour.toString().padStart(2, '0')}:00`,
      temperature: Math.round(forecastTemp * 10) / 10,
      cloudCover: Math.round(forecastCloudCover),
      solarIrradiance: Math.round(calculateSolarIrradiance(forecastHour, forecastCloudCover)),
    });
  }

  // Calculate sunrise/sunset times (approximate for India)
  const sunrise = new Date(now);
  sunrise.setHours(6, 30, 0, 0);
  
  const sunset = new Date(now);
  sunset.setHours(18, 30, 0, 0);

  return {
    location: `${city}, ${state}`,
    city,
    state,
    timestamp: now,
    current,
    hourlyForecast,
    sunrise,
    sunset,
  };
}

// Generate weather for primary site (Chennai by default)
export function generatePrimarySiteWeather(): Weather {
  return generateWeatherForCity('Chennai', 'Tamil Nadu');
}
