import { Command, flags } from "@oclif/command";
import BaseCommand from "./internal/base-command";
import EosProject from "../lib/eos-project";
import * as globby from "globby";
import axios from "axios";
import * as path from "path";
import death = require("death");

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default class Start extends BaseCommand {
  static flags = BaseCommand.flags;

  async run() {
    const { args, flags } = this;

    const project = await EosProject.load(this.flags.cwd, {
      stderr: true,
      stdout: !!flags.verbose,
      image: {
        repository: "eosio/eos-dev",
        tag: "latest"
      }
    });

    death(async () => {
      console.log("exit");
      await project.stop();
      process.exit();
    });

    await project.start();

    const scripts = await globby("migrate/*.js", {
      cwd: this.flags.cwd
    });

    for (let script of scripts) {
      try {
        const method = require(path.resolve(this.flags.cwd, script)) as {
          default: () => Promise<any>;
        };
        await method.default();
      } catch (e) {
        console.error(e);
      }
    }

    while (true) {
      await sleep(1000);
    }
  }
}
