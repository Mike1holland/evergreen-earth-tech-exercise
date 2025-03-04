#! /usr/bin/env node
import { Command } from "commander";

const program = new Command();

program
  .name("eecalc")
  .version("1.0.0")
  .description("Evergreen Earth location efficiency calculator")
  .parse(process.argv);
