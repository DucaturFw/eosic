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
    const project = await EosProject.load(this.flags.cwd);
    await project.start();

    let success = false;
    let tries = 0;
    while (!success && tries < 10) {
      tries++;
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        const responce = await axios.get(
          "http://127.0.0.1:8888/v1/chain/get_info"
        );
        success = true;
      } catch (e) {
        console.error("waiting for a node");
      }
    }

    const scripts = await globby("migrate/*.js", {
      cwd: this.flags.cwd
    });

    scripts.forEach(script => require(path.resolve(this.flags.cwd, script)));

    death(async () => {
      console.log("exit");
      await project.stop();
      process.exit();
    });

    while (true) {
      await sleep(1000);
      console.log("tst");
    }
  }
}
