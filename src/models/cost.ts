import type { WeatherClient } from "./weather";

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
  if (!weather) {
    return null;
  }
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

export type { HeatPump, Cost };

const VAT = 1.05;

interface House {
  submissionId: string;
  designRegion: string;
  floorArea: number;
  age: string;
  heatingFactor: number;
  insulationFactor: number;
}
