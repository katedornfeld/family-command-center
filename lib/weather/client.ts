const WEATHER_API_BASE_URL = "https://api.weatherapi.com/v1/forecast.json";
const REQUEST_TIMEOUT_MS = 10_000;

export type TodayForecast = {
  high_temp: number | null;
  low_temp: number | null;
  condition: string | null;
};

export class WeatherApiError extends Error {}

/**
 * Fetches today's forecast (high, low, condition) for the configured
 * household location from WeatherAPI.com.
 */
export async function fetchTodayForecast(
  apiKey: string,
  location: string,
): Promise<TodayForecast> {
  const url = `${WEATHER_API_BASE_URL}?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(
    location,
  )}&days=1&aqi=no&alerts=no`;

  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (err) {
    throw new WeatherApiError(
      `Could not reach the weather API: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new WeatherApiError(`Weather API returned ${response.status}: ${body}`);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch (err) {
    throw new WeatherApiError(
      `Weather API response was not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const day = (data as { forecast?: { forecastday?: Array<{ day?: unknown }> } })?.forecast
    ?.forecastday?.[0]?.day as
    | { maxtemp_f?: unknown; mintemp_f?: unknown; condition?: { text?: unknown } }
    | undefined;

  if (!day) {
    throw new WeatherApiError("Weather API response was missing the expected forecast data.");
  }

  return {
    high_temp: typeof day.maxtemp_f === "number" ? day.maxtemp_f : null,
    low_temp: typeof day.mintemp_f === "number" ? day.mintemp_f : null,
    condition: typeof day.condition?.text === "string" ? day.condition.text : null,
  };
}
