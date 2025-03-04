import { Agent } from "https";
import { getAPIKey } from "../config/password";
import axios, { AxiosError } from "axios";

let client: WeatherClient | null = null;
async function getWeatherClient() {
  if (client) {
    return client;
  }
  const apiKey = await getAPIKey();
  if (!apiKey) {
    throw new Error("API key not set");
  }
  return new WeatherClient({
    version: "v1",
    agent: new Agent({
      keepAlive: true,
      maxSockets: 1,
    }),
    apiKey,
  });
}

export { getWeatherClient };

const apiUrl = "https://063qqrtqth.execute-api.eu-west-2.amazonaws.com";

class WeatherClient {
  private baseUrl: URL = new URL(apiUrl, this.config.version);

  constructor(private readonly config: WeatherClientConfig) {}

  async getWeatherByLocation(location: string): Promise<Weather | null> {
    return this.get(Endpoints.Weather, { location });
  }

  private async get(
    endpoint: Endpoints,
    params: EndpointParams[typeof endpoint],
    retries = 0,
    backoff = 100
  ): Promise<EndpointResponses[typeof endpoint] | null> {
    const maxRetries = 5;
    try {
      const url = this.parseUrl(endpoint, params);
      const response = await axios.get<EndpointResponses[typeof endpoint]>(
        url.toString(),
        {
          headers: {
            "x-api-key": this.config.apiKey,
          },
          httpsAgent: this.config.agent,
        }
      );
      return response.data;
    } catch (error) {
      //record error, would need to expand to alerting in production
      console.error(error);
      // Architecture would likely be responsible for backoff & retries in production but implemented here given CLI context
      if (
        error instanceof AxiosError &&
        error.response &&
        [429, 500, 502, 503, 504].includes(error.response.status) &&
        retries < maxRetries
      ) {
        retries++;
        await this.delay(backoff);
        return this.get(endpoint, params, retries - 1, backoff * 2);
      }
      return null;
    }
  }

  private parseUrl(
    endpoint: Endpoints,
    params?: EndpointParams[typeof endpoint]
  ) {
    const url = new URL(endpoint, this.baseUrl);
    if (params) {
      for (const key of Object.keys(params)) {
        url.searchParams.append(key, params[key as keyof typeof params]);
      }
    }
    return url;
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

enum Endpoints {
  Weather = "weather",
}

interface EndpointParams {
  [Endpoints.Weather]: { location: string };
}

interface EndpointResponses {
  [Endpoints.Weather]: Weather;
}

interface Weather {
  location: {
    location: string;
    degreeDays: string;
    groundTemp: string;
    postcode: string;
    lat: string;
    lng: string;
  };
}

interface WeatherClientConfig {
  version: string;
  agent: Agent;
  apiKey: string;
}
