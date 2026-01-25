/**
 * Physics Utility Functions
 * 
 * Provides accurate calculations for solar energy, atmospheric effects,
 * and environmental physics used in realistic EMS simulation.
 */

export interface GeoLocation {
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface SolarPosition {
  elevation: number;    // degrees above horizon
  azimuth: number;      // degrees from north
  zenith: number;       // degrees from vertical
}

export interface SolarIrradiance {
  direct: number;       // W/m² (direct beam)
  diffuse: number;      // W/m² (scattered)
  global: number;       // W/m² (total)
}

/**
 * Calculate solar declination angle (Earth's tilt effect on seasons)
 * @param dayOfYear - Day of year (1-365)
 * @returns Declination angle in degrees
 */
export function calculateSolarDeclination(dayOfYear: number): number {
  // Cooper's equation for solar declination
  const angle = (360 / 365) * (dayOfYear - 81);
  const angleRad = (angle * Math.PI) / 180;
  return 23.45 * Math.sin(angleRad);
}

/**
 * Calculate equation of time (correction for Earth's elliptical orbit)
 * @param dayOfYear - Day of year (1-365)
 * @returns Time correction in minutes
 */
export function calculateEquationOfTime(dayOfYear: number): number {
  const b = (360 / 365) * (dayOfYear - 81);
  const bRad = (b * Math.PI) / 180;
  
  return 9.87 * Math.sin(2 * bRad) - 7.53 * Math.cos(bRad) - 1.5 * Math.sin(bRad);
}

/**
 * Calculate hour angle (sun's position relative to solar noon)
 * @param localTime - Local time in hours (0-24)
 * @param longitude - Longitude in degrees
 * @param timezone - Timezone offset in hours
 * @param dayOfYear - Day of year (1-365)
 * @returns Hour angle in degrees
 */
export function calculateHourAngle(
  localTime: number,
  longitude: number,
  timezone: number,
  dayOfYear: number
): number {
  const eot = calculateEquationOfTime(dayOfYear);
  const lstm = 15 * timezone; // Local Standard Time Meridian
  const tc = 4 * (longitude - lstm) + eot; // Time correction in minutes
  
  const lst = localTime + tc / 60; // Local Solar Time in hours
  const hourAngle = 15 * (lst - 12); // 15 degrees per hour from solar noon
  
  return hourAngle;
}

/**
 * Calculate solar position (elevation and azimuth angles)
 * @param timestamp - Unix timestamp in milliseconds
 * @param location - Geographic location
 * @returns Solar position angles
 */
export function calculateSolarPosition(
  timestamp: number,
  location: GeoLocation
): SolarPosition {
  const date = new Date(timestamp);
  
  // Calculate day of year
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  
  // Local time in hours
  const localTime = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  
  // Timezone offset in hours (approximation from longitude)
  const timezoneOffset = Math.round(location.longitude / 15);
  
  // Calculate angles
  const declination = calculateSolarDeclination(dayOfYear);
  const hourAngle = calculateHourAngle(localTime, location.longitude, timezoneOffset, dayOfYear);
  
  // Convert to radians
  const latRad = (location.latitude * Math.PI) / 180;
  const decRad = (declination * Math.PI) / 180;
  const haRad = (hourAngle * Math.PI) / 180;
  
  // Calculate solar elevation angle
  const sinElevation =
    Math.sin(latRad) * Math.sin(decRad) +
    Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);
  const elevation = (Math.asin(sinElevation) * 180) / Math.PI;
  
  // Calculate solar azimuth angle
  const cosAzimuth =
    (Math.sin(decRad) - Math.sin(latRad) * sinElevation) /
    (Math.cos(latRad) * Math.cos((elevation * Math.PI) / 180));
  let azimuth = (Math.acos(Math.max(-1, Math.min(1, cosAzimuth))) * 180) / Math.PI;
  
  // Adjust azimuth for afternoon
  if (hourAngle > 0) {
    azimuth = 360 - azimuth;
  }
  
  // Calculate zenith angle
  const zenith = 90 - elevation;
  
  return { elevation, azimuth, zenith };
}

/**
 * Calculate air mass coefficient (atmospheric path length)
 * @param zenith - Zenith angle in degrees
 * @returns Air mass coefficient (1.0 = sun directly overhead)
 */
export function calculateAirMass(zenith: number): number {
  if (zenith >= 90) return Infinity;
  
  const zenithRad = (zenith * Math.PI) / 180;
  
  // Kasten and Young formula (1989) - accurate for zenith < 85°
  const cosZenith = Math.cos(zenithRad);
  const airMass = 1 / (cosZenith + 0.50572 * Math.pow(96.07995 - zenith, -1.6364));
  
  return airMass;
}

/**
 * Calculate clear-sky solar irradiance
 * @param solarPosition - Sun position angles
 * @param altitude - Site altitude in meters
 * @returns Irradiance components in W/m²
 */
export function calculateClearSkyIrradiance(
  solarPosition: SolarPosition,
  altitude: number = 0
): SolarIrradiance {
  // Solar constant (extraterrestrial irradiance)
  const solarConstant = 1367; // W/m²
  
  // If sun is below horizon, no irradiance
  if (solarPosition.elevation <= 0) {
    return { direct: 0, diffuse: 0, global: 0 };
  }
  
  // Calculate air mass
  const airMass = calculateAirMass(solarPosition.zenith);
  
  // Atmospheric transmittance (simplified Hottel model)
  const a0 = 0.4237 - 0.00821 * Math.pow(6 - altitude / 1000, 2);
  const a1 = 0.5055 + 0.00595 * Math.pow(6.5 - altitude / 1000, 2);
  const k = 0.2711 + 0.01858 * Math.pow(2.5 - altitude / 1000, 2);
  
  const tau = a0 + a1 * Math.exp(-k * airMass);
  
  // Direct beam irradiance
  const elevationRad = (solarPosition.elevation * Math.PI) / 180;
  const direct = solarConstant * tau * Math.sin(elevationRad);
  
  // Diffuse irradiance (approximately 10-20% of direct for clear sky)
  const diffuse = 0.15 * solarConstant * Math.sin(elevationRad);
  
  // Global irradiance
  const global = direct + diffuse;
  
  return { direct, diffuse, global };
}

/**
 * Apply cloud cover effect on irradiance
 * @param clearSkyIrradiance - Clear sky irradiance
 * @param cloudCoverage - Cloud coverage (0.0 = clear, 1.0 = overcast)
 * @returns Adjusted irradiance with cloud effects
 */
export function applyCloudCover(
  clearSkyIrradiance: SolarIrradiance,
  cloudCoverage: number
): SolarIrradiance {
  // Cloud modification factor (Kasten and Czeplak, 1980)
  const clearness = 1 - cloudCoverage;
  const cloudFactor = 1 - 0.75 * Math.pow(cloudCoverage, 3.4);
  
  // Clouds affect direct more than diffuse
  const directReduction = Math.pow(clearness, 1.5);
  const diffuseIncrease = 1 + 0.3 * cloudCoverage; // Clouds scatter more diffuse light
  
  const direct = clearSkyIrradiance.direct * directReduction * cloudFactor;
  const diffuse = clearSkyIrradiance.diffuse * diffuseIncrease * cloudFactor;
  const global = direct + diffuse;
  
  return { direct, diffuse, global };
}

/**
 * Calculate seasonal temperature amplitude
 * @param dayOfYear - Day of year (1-365)
 * @param avgTemp - Annual average temperature in °C
 * @param amplitude - Seasonal temperature swing in °C
 * @returns Expected temperature for the day
 */
export function calculateSeasonalTemperature(
  dayOfYear: number,
  avgTemp: number,
  amplitude: number
): number {
  // Temperature peaks ~30 days after summer solstice (day 172)
  const phaseShift = 202;
  const angle = (2 * Math.PI * (dayOfYear - phaseShift)) / 365;
  
  return avgTemp + amplitude * Math.cos(angle);
}

/**
 * Calculate diurnal (daily) temperature variation
 * @param hour - Hour of day (0-23)
 * @param baseTemp - Base temperature for the day in °C
 * @param amplitude - Daily temperature swing in °C
 * @returns Temperature at given hour
 */
export function calculateDiurnalTemperature(
  hour: number,
  baseTemp: number,
  amplitude: number = 8
): number {
  // Temperature minimum at 6 AM, maximum at 3 PM
  const minHour = 6;
  const maxHour = 15;
  
  let factor: number;
  if (hour < minHour) {
    // Late night - declining
    factor = -1 + (hour / minHour) * 0.2;
  } else if (hour < maxHour) {
    // Morning to afternoon - rising
    const progress = (hour - minHour) / (maxHour - minHour);
    factor = -1 + 2 * progress;
  } else if (hour < 21) {
    // Evening - declining
    const progress = (hour - maxHour) / (21 - maxHour);
    factor = 1 - 2 * progress;
  } else {
    // Late evening to night
    const progress = (hour - 21) / (24 + minHour - 21);
    factor = -1 + (1 - progress) * 0.2;
  }
  
  return baseTemp + amplitude * factor;
}

/**
 * Calculate HVAC cooling load based on temperature
 * @param currentTemp - Current temperature in °C
 * @param setpoint - Desired temperature in °C
 * @param basePower - HVAC base power in kW
 * @param maxPower - HVAC maximum power in kW
 * @returns HVAC power consumption in kW
 */
export function calculateHVACLoad(
  currentTemp: number,
  setpoint: number,
  basePower: number,
  maxPower: number
): number {
  const tempDiff = currentTemp - setpoint;
  
  // No cooling needed if below setpoint
  if (tempDiff <= 0) return basePower * 0.2; // Minimum fan power
  
  // Linear relationship with saturation
  const loadFactor = Math.min(tempDiff / 10, 1.0); // Max at 10°C above setpoint
  
  return basePower + (maxPower - basePower) * loadFactor;
}

/**
 * Calculate thermal mass effect (building heat retention)
 * @param previousTemp - Previous building temperature in °C
 * @param targetTemp - Target (outdoor influenced) temperature in °C
 * @param thermalMass - Thermal mass coefficient (0-1, higher = more inertia)
 * @returns New building temperature in °C
 */
export function applyThermalMass(
  previousTemp: number,
  targetTemp: number,
  thermalMass: number = 0.8
): number {
  // Building temperature changes slowly due to thermal mass
  return previousTemp * thermalMass + targetTemp * (1 - thermalMass);
}

/**
 * Calculate day of year from timestamp
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Day of year (1-365)
 */
export function getDayOfYear(timestamp: number): number {
  const date = new Date(timestamp);
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  return dayOfYear;
}

/**
 * Calculate sunrise and sunset times
 * @param timestamp - Unix timestamp in milliseconds
 * @param location - Geographic location
 * @returns Sunrise and sunset times as Date objects
 */
export function calculateSunTimes(
  timestamp: number,
  location: GeoLocation
): { sunrise: Date; sunset: Date } {
  const date = new Date(timestamp);
  const dayOfYear = getDayOfYear(timestamp);
  const declination = calculateSolarDeclination(dayOfYear);
  
  const latRad = (location.latitude * Math.PI) / 180;
  const decRad = (declination * Math.PI) / 180;
  
  // Hour angle at sunrise/sunset (sun at horizon, elevation = 0)
  const cosHA = -Math.tan(latRad) * Math.tan(decRad);
  
  // No sunrise/sunset at extreme latitudes in certain seasons
  if (cosHA > 1) {
    // Polar night
    const midnight = new Date(date);
    midnight.setHours(0, 0, 0, 0);
    return { sunrise: midnight, sunset: midnight };
  } else if (cosHA < -1) {
    // Midnight sun
    const noon = new Date(date);
    noon.setHours(12, 0, 0, 0);
    return { sunrise: noon, sunset: noon };
  }
  
  const hourAngleRad = Math.acos(cosHA);
  const hourAngleDeg = (hourAngleRad * 180) / Math.PI;
  const hourAngleHours = hourAngleDeg / 15;
  
  const eot = calculateEquationOfTime(dayOfYear);
  const timezoneOffset = Math.round(location.longitude / 15);
  const lstm = 15 * timezoneOffset;
  const tc = 4 * (location.longitude - lstm) + eot;
  
  const sunriseLocal = 12 - hourAngleHours - tc / 60;
  const sunsetLocal = 12 + hourAngleHours - tc / 60;
  
  const sunrise = new Date(date);
  sunrise.setHours(Math.floor(sunriseLocal), Math.floor((sunriseLocal % 1) * 60), 0, 0);
  
  const sunset = new Date(date);
  sunset.setHours(Math.floor(sunsetLocal), Math.floor((sunsetLocal % 1) * 60), 0, 0);
  
  return { sunrise, sunset };
}
