import { ClientErrors, ClientError, type WeatherClient } from "./weather";

async function getCostResult(
  house: House,
  heatLoss: number,
  powerHeatLoss: number,
  recommendedHeatPump: HeatPump,
  totalCost: number
) {
  /* Assumption: The cost will always be displayed in GBP */
  return `--------------------------------------
      ${house.submissionId}
      --------------------------------------
      \u00A0\u00A0Estimate Heat Loss: ${heatLoss}
      \u00A0\u00A0Design Region: ${house.designRegion}
      \u00A0\u00A0Power Heat Loss: ${powerHeatLoss}
      \u00A0\u00A0Recommended Heat Pump: ${recommendedHeatPump.label}
      \u00A0\u00A0Cost Breakdown:
      ${recommendedHeatPump.costs
        .map(
          (cost) =>
            `\u00A0\u00A0\u00A0\u00A0${cost.label} ${cost.cost.toLocaleString(
              "en-GB",
              {
                style: "currency",
                currency: "GBP",
              }
            )}`
        )
        .join("\n")}
        \u00A0\u00A0Total Cost, including VAT: ${totalCost.toLocaleString(
          "en-GB",
          {
            style: "currency",
            currency: "GBP",
          }
        )}`.replaceAll("  ", "");
}

function calculateCost(recommendedHeatPump: HeatPump) {
  const totalCost = recommendedHeatPump.costs.reduce(
    (acc, cost) => acc + cost.cost,
    0
  );
  return totalCost * VAT;
}

function calculateHouseHeatLoss(house: House) {
  return house.floorArea * house.heatingFactor * house.insulationFactor;
}

async function calculatePowerHeatLoss(
  house: House,
  heatLoss: number,
  weatherClient: WeatherClient
) {
  const weather = await weatherClient.getWeatherByLocation(house.designRegion);
  return heatLoss / weather?.degreeDays;
}

/**
 * Assumption: Recommended heat pump is the one with the lowest
 * output capacity that is greater than or equal to the power
 * heat loss
 */
async function getRecommendedHeatPump(
  heatPumps: HeatPump[],
  powerHeatLoss: number
): Promise<HeatPump | null> {
  const applicableHeatPumps = heatPumps
    .filter((heatPump) => heatPump.outputCapacity >= powerHeatLoss)
    .sort((a, b) => a.outputCapacity - b.outputCapacity);
  return applicableHeatPumps.at(0) || null;
}

export {
  calculateCost,
  calculateHouseHeatLoss,
  calculatePowerHeatLoss,
  getRecommendedHeatPump,
  getCostResult,
};

interface HeatPump {
  label: string;
  outputCapacity: number;
  costs: Cost[];
}

interface Cost {
  label: string;
  cost: number;
}

const VAT = 1.05;

interface House {
  submissionId: string;
  designRegion: string;
  floorArea: number;
  age: string;
  heatingFactor: number;
  insulationFactor: number;
}
