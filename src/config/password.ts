import { setPassword, getPassword } from "keytar";

async function setAPIKey(apiKey: string) {
  await setPassword(service, account, apiKey);
}

async function getAPIKey() {
  return getPassword(service, account);
}

export { setAPIKey, getAPIKey };

const service = "eecalc";
const account = "weather-data-api-key";
