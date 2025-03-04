#! /usr/bin/env node
import { Command } from "commander";
import { password } from "promptly";
import { setAPIKey } from "./config/password";

const program = new Command();

program
  .name("eecalc")
  .version("1.0.0")
  .description("Evergreen Earth location efficiency calculator");

program
  .command("set-api-key")
  .description("Set the Weather Data API key")
  .action(async () => {
    const apiKey = await password("Enter your Weather Data API key: ");
    await setAPIKey(apiKey);
  });

program.parse(process.argv);
