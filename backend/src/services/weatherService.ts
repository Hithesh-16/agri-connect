import { config } from '../config';
import { createChildLogger } from '../config/logger';

const log = createChildLogger('weather');

// Simple in-memory cache
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) return entry.data as T;
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
}

interface OWMCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

function mapCondition(owmMain: string): string {
  const map: Record<string, string> = {
    Clear: 'sunny',
    Clouds: 'cloudy',
    Rain: 'rainy',
    Drizzle: 'rainy',
    Thunderstorm: 'rainy',
    Snow: 'cloudy',
    Mist: 'cloudy',
    Haze: 'partly_cloudy',
    Fog: 'cloudy',
  };
  return map[owmMain] || 'partly_cloudy';
}

export class WeatherService {
  /**
   * Fetches weather from OpenWeatherMap if API key is configured,
   * otherwise returns realistic mock data for Telangana.
   */
  static async getCurrentWeather(lat = 17.977, lon = 79.601) {
    const cacheKey = `weather:${lat}:${lon}`;
    const cached = getCached<ReturnType<typeof WeatherService.getMockWeather>>(cacheKey);
    if (cached) return cached;

    if (config.openWeatherMapKey) {
      try {
        const data = await this.fetchFromOpenWeatherMap(lat, lon);
        setCache(cacheKey, data);
        return data;
      } catch (err) {
        log.error({ err }, 'OpenWeatherMap API failed, falling back to mock');
      }
    }

    const mock = this.getMockWeather();
    setCache(cacheKey, mock);
    return mock;
  }

  private static async fetchFromOpenWeatherMap(lat: number, lon: number) {
    const key = config.openWeatherMapKey;

    // Current weather
    const currentRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`
    );
    if (!currentRes.ok) throw new Error(`OWM current: ${currentRes.status}`);
    const current: any = await currentRes.json();

    // 5-day forecast
    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${key}&units=metric&cnt=40`
    );
    if (!forecastRes.ok) throw new Error(`OWM forecast: ${forecastRes.status}`);
    const forecastData: any = await forecastRes.json();

    // Group forecast by day (take noon reading for each day)
    const dailyMap = new Map<string, { high: number; low: number; condition: OWMCondition; humidity: number; wind: number; pop: number }>();
    for (const item of forecastData.list) {
      const date = item.dt_txt.split(' ')[0];
      const existing = dailyMap.get(date);
      if (!existing) {
        dailyMap.set(date, {
          high: item.main.temp_max,
          low: item.main.temp_min,
          condition: item.weather[0],
          humidity: item.main.humidity,
          wind: item.wind.speed * 3.6, // m/s to km/h
          pop: (item.pop || 0) * 100,
        });
      } else {
        existing.high = Math.max(existing.high, item.main.temp_max);
        existing.low = Math.min(existing.low, item.main.temp_min);
        // Use the worst condition (rain > clouds > clear)
        if (item.weather[0].id < existing.condition.id) {
          existing.condition = item.weather[0];
        }
      }
    }

    const forecast = Array.from(dailyMap.entries()).slice(0, 5).map(([date, d], i) => ({
      date,
      dayOfWeek: i === 0 ? 'Today' : new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      high: Math.round(d.high),
      low: Math.round(d.low),
      humidity: d.humidity,
      windSpeed: Math.round(d.wind),
      description: d.condition.description,
      icon: mapCondition(d.condition.main),
      chanceOfRain: Math.round(d.pop),
    }));

    const condition = current.weather?.[0];

    return {
      source: 'openweathermap',
      current: {
        location: `${current.name}, ${forecastData.city?.name || 'Telangana'}`,
        lat,
        lon,
        temperature: Math.round(current.main.temp),
        feelsLike: Math.round(current.main.feels_like),
        humidity: current.main.humidity,
        windSpeed: Math.round(current.wind.speed * 3.6),
        windDirection: this.degToCompass(current.wind.deg),
        pressure: current.main.pressure,
        visibility: Math.round((current.visibility || 10000) / 1000),
        uvIndex: 0,
        description: condition?.description || 'Clear',
        icon: mapCondition(condition?.main || 'Clear'),
        condition: mapCondition(condition?.main || 'Clear'),
        tempC: Math.round(current.main.temp),
        windKph: Math.round(current.wind.speed * 3.6),
        updatedAt: new Date().toISOString(),
      },
      forecast,
      advisories: this.generateAdvisories(forecast),
    };
  }

  private static degToCompass(deg: number): string {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
  }

  private static generateAdvisories(forecast: { chanceOfRain: number; high: number }[]) {
    const advisories: { type: string; message: string; severity: string }[] = [];
    const rainyDays = forecast.filter(f => f.chanceOfRain > 60).length;
    const hotDays = forecast.filter(f => f.high > 38).length;

    if (rainyDays >= 2) {
      advisories.push({
        type: 'rain',
        message: 'Heavy rainfall expected in coming days. Secure harvested produce and delay sowing if possible.',
        severity: 'moderate',
      });
    } else if (rainyDays === 1) {
      advisories.push({
        type: 'rain',
        message: 'Light showers expected. Good conditions for standing crops.',
        severity: 'low',
      });
    }

    if (hotDays >= 2) {
      advisories.push({
        type: 'temperature',
        message: 'High temperatures expected. Ensure adequate irrigation and consider mulching.',
        severity: 'moderate',
      });
    }

    if (advisories.length === 0) {
      advisories.push({
        type: 'general',
        message: 'Weather conditions are favorable for agricultural activities this week.',
        severity: 'low',
      });
    }

    return advisories;
  }

  static getMockWeather() {
    return {
      source: 'mock',
      current: {
        location: 'Warangal, Telangana',
        lat: 17.977,
        lon: 79.601,
        temperature: 34,
        feelsLike: 37,
        humidity: 52,
        windSpeed: 12,
        windDirection: 'SW',
        pressure: 1008,
        visibility: 8,
        uvIndex: 7,
        description: 'Partly cloudy',
        icon: 'partly_cloudy',
        condition: 'partly_cloudy',
        tempC: 28,
        windKph: 14,
        updatedAt: new Date().toISOString(),
      },
      forecast: [
        { date: this.formatDate(0), dayOfWeek: 'Today', high: 31, low: 22, humidity: 55, windSpeed: 10, description: 'Partly cloudy', icon: 'partly_cloudy', chanceOfRain: 10 },
        { date: this.formatDate(1), dayOfWeek: this.getDayOfWeek(1), high: 33, low: 23, humidity: 48, windSpeed: 8, description: 'Sunny', icon: 'sunny', chanceOfRain: 5 },
        { date: this.formatDate(2), dayOfWeek: this.getDayOfWeek(2), high: 27, low: 21, humidity: 65, windSpeed: 15, description: 'Rain', icon: 'rainy', chanceOfRain: 70 },
        { date: this.formatDate(3), dayOfWeek: this.getDayOfWeek(3), high: 26, low: 20, humidity: 75, windSpeed: 18, description: 'Rain', icon: 'rainy', chanceOfRain: 85 },
        { date: this.formatDate(4), dayOfWeek: this.getDayOfWeek(4), high: 29, low: 21, humidity: 60, windSpeed: 12, description: 'Cloudy', icon: 'cloudy', chanceOfRain: 30 },
      ],
      advisories: [
        { type: 'rain', message: 'Pre-monsoon showers expected in 2-3 days. Secure harvested produce.', severity: 'moderate' },
        { type: 'temperature', message: 'High temperatures this week. Ensure adequate irrigation for standing crops.', severity: 'low' },
      ],
    };
  }

  private static formatDate(daysFromNow: number): string {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().split('T')[0];
  }

  private static getDayOfWeek(daysFromNow: number): string {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  }
}
