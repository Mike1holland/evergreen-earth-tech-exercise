import {
  calculateCost,
  calculateHouseHeatLoss,
  calculatePowerHeatLoss,
  getRecommendedHeatPump,
  getCostResult,
} from "../src/models/cost";
import { WeatherClient } from "../src/models/weather";
import { Agent } from "https";

describe("Cost Model Functions", () => {
  class MockWeatherClient extends WeatherClient {
    async getWeatherByLocation(location: string) {
      return {
        location: location,
        degreeDays: 200,
        groundTemp: 10,
        postcode: "SW1A 1AA",
        lat: 51.5033,
        lng: -0.1276,
      };
    }
  }

  let mockWeatherClient: MockWeatherClient;
  beforeAll(() => {
    mockWeatherClient = new MockWeatherClient({
      apiKey: "12345",
      agent: new Agent(),
      version: "v1",
    });
  });

  test("calculateCost should return the total cost including VAT", () => {
    const totalCost = calculateCost(mockHeatPump);
    expect(totalCost).toBe(9674.7); // 4216 + 2900 + 150 + 300 + 1648 + 675.7
  });

  test("calculateHouseHeatLoss should return the correct heat loss", () => {
    const heatLoss = calculateHouseHeatLoss(mockHouse);
    expect(heatLoss).toBe(16412.5); // 125 * 101 * 1.3
  });

  test("calculatePowerHeatLoss should return the correct power heat loss", async () => {
    const heatLoss = 96;
    const powerHeatLoss = await calculatePowerHeatLoss(
      mockHouse,
      heatLoss,
      mockWeatherClient
    );
    expect(powerHeatLoss).toBe(0.48); // 96 / 200
  });

  test("getRecommendedHeatPump should return the correct heat pump", async () => {
    const powerHeatLoss = 0.48;
    const recommendedHeatPump = await getRecommendedHeatPump(
      mockHeatPumps,
      powerHeatLoss
    );
    expect(recommendedHeatPump).toBe(mockHeatPumps[1]); // 5kW Package
  });

  test("getCostResult should return the correct cost result string", async () => {
    const heatLoss = 96;
    const powerHeatLoss = 0.48;
    const totalCost = 1575;
    const costResult = await getCostResult(
      mockHouse,
      heatLoss,
      powerHeatLoss,
      mockHeatPump,
      totalCost
    );
    expect(costResult).toContain("4cb3820a-7bf6-47f9-8afc-3adcac8752cd");
    expect(costResult).toContain("Estimate Heat Loss: 96");
    expect(costResult).toContain("Design Region: Severn Valley (Filton)");
    expect(costResult).toContain("Power Heat Loss: 0.48");
    expect(costResult).toContain("Recommended Heat Pump: 8kW Package");
    expect(costResult).toContain(
      "Supply & Installation of your Homely Smart Thermostat £150.00"
    );
    expect(costResult).toContain(
      "Supply & Installation of a new Consumer Unit £300.00"
    );
    expect(costResult).toContain(
      "MCS System Commissioning & HIES Insurance-backed Warranty £1,648.00"
    );
    expect(costResult).toContain("Total Cost, including VAT: £1,575.00");
  });
});

const mockHouse = {
  submissionId: "4cb3820a-7bf6-47f9-8afc-3adcac8752cd",
  designRegion: "Severn Valley (Filton)",
  floorArea: 125,
  age: "1967 - 1975",
  heatingFactor: 101,
  insulationFactor: 1.3,
};

const mockHeatPumps = [
  {
    label: "8kW Package",
    outputCapacity: 8,
    costs: [
      {
        label:
          "Design & Supply of your Air Source Heat Pump System Components (8kW)",
        cost: 4216,
      },
      {
        label:
          "Installation of your Air Source Heat Pump and Hot Water Cylinder",
        cost: 2900,
      },
      {
        label: "Supply & Installation of your Homely Smart Thermostat",
        cost: 150,
      },
      { label: "Supply & Installation of a new Consumer Unit", cost: 300 },
      {
        label: "MCS System Commissioning & HIES Insurance-backed Warranty",
        cost: 1648,
      },
    ],
  },
  {
    label: "5kW Package",
    outputCapacity: 5,
    costs: [
      {
        label:
          "Design & Supply of your Air Source Heat Pump System Components (5kW)",
        cost: 3947,
      },
      {
        label:
          "Installation of your Air Source Heat Pump and Hot Water Cylinder",
        cost: 2900,
      },
      {
        label: "Supply & Installation of your Homely Smart Thermostat",
        cost: 150,
      },
      { label: "Supply & Installation of a new Consumer Unit", cost: 300 },
      {
        label: "MCS System Commissioning & HIES Insurance-backed Warranty",
        cost: 1648,
      },
    ],
  },
  {
    label: "16kW Package",
    outputCapacity: 16,
    costs: [
      {
        label:
          "Design & Supply of your Air Source Heat Pump System Components (16kW)",
        cost: 5421,
      },
      {
        label:
          "Installation of your Air Source Heat Pump and Hot Water Cylinder",
        cost: 2900,
      },
      {
        label: "Supply & Installation of your Homely Smart Thermostat",
        cost: 150,
      },
      { label: "Supply & Installation of a new Consumer Unit", cost: 300 },
      {
        label: "MCS System Commissioning & HIES Insurance-backed Warranty",
        cost: 1648,
      },
    ],
  },
  {
    label: "12kW Package",
    outputCapacity: 12,
    costs: [
      {
        label:
          "Design & Supply of your Air Source Heat Pump System Components (12kW)",
        cost: 5138,
      },
      {
        label:
          "Installation of your Air Source Heat Pump and Hot Water Cylinder",
        cost: 2900,
      },
      {
        label: "Supply & Installation of your Homely Smart Thermostat",
        cost: 150,
      },
      { label: "Supply & Installation of a new Consumer Unit", cost: 300 },
      {
        label: "MCS System Commissioning & HIES Insurance-backed Warranty",
        cost: 1648,
      },
    ],
  },
];

const mockHeatPump = mockHeatPumps[0];
