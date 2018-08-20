import BaseCommand from "./internal/base-command";
import * as Mocha from "mocha";
import * as globby from "globby";
import * as path from "path";
import EosProject from "../lib/eos-project";

export default class Test extends BaseCommand {
  static flags = BaseCommand.flags;

  async run() {
    const { args, flags } = this;
    const project = await EosProject.load(flags.cwd, {
      stderr: true,
      stdout: !!flags.verbose,
      image: {
        repository: "eosio/eos-dev",
        tag: "latest"
      }
    });

    await project.start();

    const mocha = new Mocha();
    const tests = await globby(["test/**/*.test.js", "lib/**/*.test.js"], {
      cwd: flags.cwd
    });

    tests.forEach(test => {
      mocha.addFile(path.resolve(flags.cwd, test));
    });

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
