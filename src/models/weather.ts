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
    throw new ClientError(ClientErrors.MissingCredentials);
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

class WeatherClient {
  constructor(private readonly config: WeatherClientConfig) {}

  async getWeatherByLocation(location: string): Promise<LocationWeather> {
    const response = await this.get(Endpoints.Weather, { location });
    return {
      location: response.location.location,
      degreeDays: parseFloat(response.location.degreeDays),
      groundTemp: parseFloat(response.location.groundTemp),
      postcode: response.location.postcode,
      lat: parseFloat(response.location.lat),
      lng: parseFloat(response.location.lng),
    };
  }

  private async get(
    endpoint: Endpoints,
    params: EndpointParams[typeof endpoint],
    retries = 0,
    backoff = 100
  ): Promise<EndpointResponses[typeof endpoint]> {
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

      if (
        error instanceof AxiosError &&
        error.response &&
        error.response.status === 404
      ) {
        throw new ClientError(ClientErrors.NotFound);
      }
      // Architecture would likely be responsible for backoff & retries in production but implemented here given CLI context
      if (
        error instanceof AxiosError &&
        error.response &&
        [
          429,
          500,
          502,
          503,
          504,
          418, //🫖
        ].includes(error.response.status) &&
        retries < maxRetries
      ) {
        retries++;
        await this.delay(backoff);
        return this.get(endpoint, params, retries - 1, backoff * 2);
      }
      throw new ClientError(ClientErrors.Generic);
    }
  }

  private parseUrl(
    endpoint: Endpoints,
    params?: EndpointParams[typeof endpoint]
  ) {
    const url = new URL(`${this.config.version}/${endpoint}`, apiUrl);
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

function handleClientError(
  error: ClientError,
  submissionId: string,
  heatLoss: number
) {
  switch (error.type) {
    case ClientErrors.MissingCredentials:
      return "Credentials missing, please use set-api-key command";
    case ClientErrors.NotFound:
      return `--------------------------------------
      ${submissionId}
      --------------------------------------
      \u00A0\u00A0Estimate Heat Loss: ${heatLoss}
      \u00A0\u00A0Warning: Could not find design region`.replaceAll("  ", "");
    default:
      return "An unexpected error occurred";
  }
}

class ClientError extends Error {
  constructor(public type: ClientErrors) {
    super("Client error: " + type);
    this.name = "ClientError";
    this.type = type;
  }
}

enum ClientErrors {
  Generic = "Failed to get weather data",
  NotFound = "Location not found",
  MissingCredentials = "API key not set",
}

export {
  getWeatherClient,
  ClientError,
  ClientErrors,
  WeatherClient,
  handleClientError,
};

const apiUrl = "https://063qqrtqth.execute-api.eu-west-2.amazonaws.com";

enum Endpoints {
  Weather = "weather",
}

interface EndpointParams {
  [Endpoints.Weather]: { location: string };
}

interface EndpointResponses {
  [Endpoints.Weather]: WeatherResponse;
}

interface WeatherResponse {
  location: {
    location: string;
    degreeDays: string;
    groundTemp: string;
    postcode: string;
    lat: string;
    lng: string;
  };
}

interface LocationWeather {
  location: string;
  degreeDays: number;
  groundTemp: number;
  postcode: string;
  lat: number;
  lng: number;
}

interface WeatherClientConfig {
  version: string;
  agent: Agent;
  apiKey: string;
}
