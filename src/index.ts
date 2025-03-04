#! /usr/bin/env node
import { Command } from "commander";
import { password } from "promptly";
import { setAPIKey } from "./config/password";
import {
  calculateHouseHeatLoss,
  calculatePowerHeatLoss,
  getRecommendedHeatPump,
  calculateCost,
  getCostResult,
} from "./models/cost";
import houses from "./data/houses.json";
import heatpumps from "./data/heat-pumps.json";
import { getWeatherClient } from "./models/weather";

const program = new Command();

program
  .name("eecalc")
  .version("1.0.0")
  .description("Evergreen Earth cost calculator");

program
  .command("set-api-key")
  .description("Set the Weather Data API key")
  .action(async () => {
    const apiKey = await password("Enter your Weather Data API key: ");
    await setAPIKey(apiKey);
  });

program
  .command("calculate")
  .description("Calculate the cost of installation based on house data")
  .argument(
    "submission-id",
    "The submission ID of the house to calculate the cost for"
  )
  .action(async (submissionId) => {
    const weatherClient = await getWeatherClient();
    const house = houses.find((house) => house.submissionId === submissionId);
    if (!house) {
      console.error("House not found");
      return;
    }
    const heatLoss = calculateHouseHeatLoss(house);
    const powerHeatLoss = await calculatePowerHeatLoss(
      house,
      heatLoss,
      weatherClient
    );
    if (!powerHeatLoss) {
      console.error("Failed to calculate power heat loss");
      return;
    }
    const recommendedHeatPump = await getRecommendedHeatPump(
      heatpumps,
      powerHeatLoss
    );
    if (!recommendedHeatPump) {
      console.error("No recommended heat pump found");
      return;
    }
    const totalCost = calculateCost(recommendedHeatPump);
    const costResult = getCostResult(
      house,
      heatLoss,
      powerHeatLoss,
      recommendedHeatPump,
      totalCost
    );

    console.log(costResult);
  });

program.parse(process.argv);
