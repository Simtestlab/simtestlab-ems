'use client';

import { Weather } from '@/domain/entities/weather.entity';
import { Cloud, CloudRain, Sun, Wind, Droplets, Eye, Sunrise, Sunset, Zap } from 'lucide-react';

interface WeatherWidgetProps {
  weather: Weather;
}

const conditionIcons = {
  clear: Sun,
  partly_cloudy: Cloud,
  cloudy: Cloud,
  rainy: CloudRain,
  stormy: CloudRain,
};

const conditionLabels = {
  clear: 'Clear Sky',
  partly_cloudy: 'Partly Cloudy',
  cloudy: 'Cloudy',
  rainy: 'Rainy',
  stormy: 'Stormy',
};

const conditionColors = {
  clear: 'text-yellow-500',
  partly_cloudy: 'text-gray-400',
  cloudy: 'text-gray-500',
  rainy: 'text-blue-500',
  stormy: 'text-purple-500',
};

export default function WeatherWidget({ weather }: WeatherWidgetProps) {
  const ConditionIcon = conditionIcons[weather.current.condition];
  const iconColor = conditionColors[weather.current.condition];

  // Convert sunrise/sunset to Date objects if they're strings
  const sunrise = typeof weather.sunrise === 'string' ? new Date(weather.sunrise) : weather.sunrise;
  const sunset = typeof weather.sunset === 'string' ? new Date(weather.sunset) : weather.sunset;

  // Calculate solar generation potential (0-100%)
  const solarPotential = Math.round((weather.current.solarIrradiance / 1000) * 100);
  
  const potentialColor = 
    solarPotential > 70 ? 'text-green-600' : 
    solarPotential > 40 ? 'text-yellow-600' : 
    'text-orange-600';

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md border border-blue-200 p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
          <Cloud className="text-blue-500" size={24} />
          Weather Conditions
        </h2>
        <p className="text-sm text-gray-600">{weather.location}</p>
      </div>

      {/* Current Weather */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <ConditionIcon className={iconColor} size={56} strokeWidth={1.5} />
          <div>
            <p className="text-4xl font-bold text-gray-900">
              {weather.current.temperature}°C
            </p>
            <p className="text-sm text-gray-600">
              Feels like {weather.current.feelsLike}°C
            </p>
            <p className="text-sm font-medium text-gray-700 mt-1">
              {conditionLabels[weather.current.condition]}
            </p>
          </div>
        </div>
      </div>

      {/* Weather Details Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Droplets size={18} className="text-blue-500" />
          <div>
            <p className="text-xs text-gray-600">Humidity</p>
            <p className="text-sm font-semibold text-gray-900">{weather.current.humidity}%</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Wind size={18} className="text-gray-500" />
          <div>
            <p className="text-xs text-gray-600">Wind</p>
            <p className="text-sm font-semibold text-gray-900">
              {weather.current.windSpeed} km/h {weather.current.windDirection}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Cloud size={18} className="text-gray-400" />
          <div>
            <p className="text-xs text-gray-600">Cloud Cover</p>
            <p className="text-sm font-semibold text-gray-900">{weather.current.cloudCover}%</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Eye size={18} className="text-purple-500" />
          <div>
            <p className="text-xs text-gray-600">UV Index</p>
            <p className="text-sm font-semibold text-gray-900">{weather.current.uvIndex}</p>
          </div>
        </div>
      </div>

      {/* Solar Generation Impact */}
      <div className="bg-white rounded-lg p-4 border border-blue-200 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-orange-500" />
            <span className="text-sm font-semibold text-gray-900">Solar Generation</span>
          </div>
          <span className={`text-lg font-bold ${potentialColor}`}>
            {solarPotential}%
          </span>
        </div>
        
        <div className="h-2 rounded-full bg-gray-200 overflow-hidden mb-2">
          <div 
            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-orange-400 to-yellow-400"
            style={{ width: `${solarPotential}%` }}
          />
        </div>
        
        <p className="text-xs text-gray-600">
          Irradiance: {weather.current.solarIrradiance} W/m²
        </p>
      </div>

      {/* Sun Times */}
      <div className="flex items-center justify-between text-xs text-gray-600 pt-4 border-t border-blue-200">
        <div className="flex items-center gap-1.5">
          <Sunrise size={16} className="text-orange-400" />
          <span>{sunrise.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Sunset size={16} className="text-orange-600" />
          <span>{sunset.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
}
