import { Command, flags } from "@oclif/command";
import BaseCommand from "./internal/base-command";
import * as Mocha from "mocha";
import * as globby from "globby";
import * as path from "path";
import axios from "axios";
import EosProject from "../lib/eos-project";

async function sleep(sec: number) {
  return new Promise(resolve => setTimeout(resolve, sec * 1000));
}

export default class Test extends BaseCommand {
  static flags = BaseCommand.flags;

  async run() {
    const project = await EosProject.load(this.flags.cwd);

    await project.start();

    const mocha = new Mocha();
    const tests = await globby(["test/**/*.test.js", "lib/**/*.test.js"], {
      cwd: this.flags.cwd
    });

    console.log(tests);

    tests.forEach(test => {
      mocha.addFile(path.resolve(this.flags.cwd, test));
    });

    let success = false;
    let tries = 0;
    while (!success && tries < 10) {
      tries++;
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        const responce = await axios.get(
          "http://0.0.0.0:8888/v1/chain/get_info"
        );
        success = true;
      } catch (e) {
        console.error(`waiting for a node (${tries} try)`);
      }
    }

    mocha.timeout(20000);

    try {
      mocha.run(async failures => {
        await project.stop();
        process.exitCode = failures ? -1 : 0; // exit with non-zero status if there were failures
      });
    } catch (e) {
      require("signale").fatal(e);
      await project.stop();
      process.exitCode = -1;
    }
  }
}
