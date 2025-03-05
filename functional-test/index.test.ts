import { Command } from "commander";
import { password } from "promptly";
import { setAPIKey } from "../src/config/password";
import {
  handleClientError,
  ClientError,
  getWeatherClient,
  ClientErrors,
} from "../src/models/weather";
import houses from "../src/data/houses.json";
import heatpumps from "../src/data/heat-pumps.json";
import {
  calculateHouseHeatLoss,
  calculatePowerHeatLoss,
  getRecommendedHeatPump,
  calculateCost,
  getCostResult,
} from "../src/models/cost";

jest.mock("promptly");
jest.mock("../src/config/password");
jest.mock("../src/models/cost");
jest.mock("../src/models/weather");
jest.mock("../src/data/houses.json", () => [
  { submissionId: "123", data: "houseData" },
]);
jest.mock("../src/data/heat-pumps.json", () => [
  { id: "heatPump1", cost: 1000 },
]);

describe("eecalc CLI", () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    jest.clearAllMocks();
  });

  it("should set API key", async () => {
    (password as jest.Mock).mockResolvedValue("test-api-key");
    (setAPIKey as jest.Mock).mockResolvedValue(undefined);

    program.command("set-api-key").action(async () => {
      const apiKey = await password("Enter your Weather Data API key: ");
      await setAPIKey(apiKey);
    });

    await program.parseAsync(["node", "eecalc", "set-api-key"]);

    expect(password).toHaveBeenCalledWith("Enter your Weather Data API key: ");
    expect(setAPIKey).toHaveBeenCalledWith("test-api-key");
  });

  it("should calculate cost for a valid submission ID", async () => {
    const mockWeatherClient = {};
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    (getWeatherClient as jest.Mock).mockResolvedValue(mockWeatherClient);
    (calculateHouseHeatLoss as jest.Mock).mockReturnValue(100);
    (calculatePowerHeatLoss as jest.Mock).mockResolvedValue(200);
    (getRecommendedHeatPump as jest.Mock).mockResolvedValue({
      id: "heatPump1",
      cost: 1000,
    });
    (calculateCost as jest.Mock).mockReturnValue(3000);
    (getCostResult as jest.Mock).mockReturnValue("Cost result");

    program
      .command("calculate")
      .argument("submission-id")
      .action(async (submissionId) => {
        const weatherClient = await getWeatherClient();
        const house = houses.find(
          (house) => house.submissionId === submissionId
        );
        if (!house) {
          console.error("Submission not found");
          return;
        }
        const heatLoss = calculateHouseHeatLoss(house);
        try {
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
        } catch (error) {
          if (error instanceof ClientError) {
            handleClientError(error, submissionId, heatLoss);
          }
          console.error(error);
        }
      });

    await program.parseAsync(["node", "eecalc", "calculate", "123"]);

    expect(getWeatherClient).toHaveBeenCalled();
    expect(calculateHouseHeatLoss).toHaveBeenCalledWith({
      submissionId: "123",
      data: "houseData",
    });
    expect(calculatePowerHeatLoss).toHaveBeenCalledWith(
      { submissionId: "123", data: "houseData" },
      100,
      mockWeatherClient
    );
    expect(getRecommendedHeatPump).toHaveBeenCalledWith(heatpumps, 200);
    expect(calculateCost).toHaveBeenCalledWith({ id: "heatPump1", cost: 1000 });
    expect(getCostResult).toHaveBeenCalledWith(
      { submissionId: "123", data: "houseData" },
      100,
      200,
      { id: "heatPump1", cost: 1000 },
      3000
    );
    expect(consoleLogSpy).toHaveBeenCalledWith("Cost result");
  });

  it("should handle submission not found", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    program
      .command("calculate")
      .argument("submission-id")
      .action(async (submissionId) => {
        const house = houses.find(
          (house) => house.submissionId === submissionId
        );
        if (!house) {
          console.error("Submission not found");
          return;
        }
      });

    await program.parseAsync(["node", "eecalc", "calculate", "999"]);

    expect(consoleErrorSpy).toHaveBeenCalledWith("Submission not found");
  });

  it("should handle ClientError", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    const mockClientError = new ClientError(ClientErrors.Generic);

    (getWeatherClient as jest.Mock).mockResolvedValue({});
    (calculateHouseHeatLoss as jest.Mock).mockReturnValue(100);
    (calculatePowerHeatLoss as jest.Mock).mockRejectedValue(mockClientError);

    program
      .command("calculate")
      .argument("submission-id")
      .action(async (submissionId) => {
        const weatherClient = await getWeatherClient();
        const house = houses.find(
          (house) => house.submissionId === submissionId
        );
        if (!house) {
          console.error("Submission not found");
          return;
        }
        const heatLoss = calculateHouseHeatLoss(house);
        try {
          await calculatePowerHeatLoss(house, heatLoss, weatherClient);
        } catch (error) {
          if (error instanceof ClientError) {
            handleClientError(error, submissionId, heatLoss);
          }
          console.error(error);
        }
      });

    await program.parseAsync(["node", "eecalc", "calculate", "123"]);

    expect(handleClientError).toHaveBeenCalledWith(mockClientError, "123", 100);
    expect(consoleErrorSpy).toHaveBeenCalledWith(mockClientError);
  });
});
