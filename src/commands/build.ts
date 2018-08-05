import { Command, flags } from "@oclif/command";
import BaseCommand from "./internal/base-command";
import EosProject from "../lib/eos-project";
import Docker from "../lib/docker";
import EosDocker from "../lib/eos-docker";
import * as signale from "signale";

import * as path from "path";

function makeContractPaths(count: number) {
  return Array(count)
    .fill(0)
    .map((_, index) => ({
      required: false,
      hidden: true,
      name: index.toString()
    }));
}

export default class Compile extends BaseCommand {
  static args = [
    {
      name: "cpp",
      required: true
    }
  ];

  static flags = BaseCommand.flags;

  static description = `Build providen file as eosio contract`;

  static examples = ["$ eosic build <your-contract.cpp>"];

  async run() {
    const { args, flags } = this;

    const docker = await Docker.create<EosDocker>(EosDocker, {
      cwd: flags.cwd,
      container: {
        binds: {
          "/contracts/external": path.dirname(
            path.isAbsolute(args.cpp)
              ? args.cpp
              : path.resolve(flags.cwd, args.cpp)
          )
        }
      },
      logs(msg: any, ...args: any[]) {
        msg.split("\n").forEach((line: string) => {
          signale.debug(`[${(<Docker>this).options.container!.name}]: ${line}`);
        });
      },
      errors(msg: any, ...args: any[]) {
        msg.split("\n").forEach((line: string) => {
          signale.warn(`[${(<Docker>this).options.container!.name}]: ${line}`);
        });
      },
      stderr: true,
      stdout: false
    });

    if ((<string>args.cpp).indexOf(".cpp") === -1) {
      throw new Error("File should be .cpp");
    }

    signale.info("Start and create temporary building contrainer");
    await docker.start();
    signale.info("Wait for healthy check");
    await docker.healthy();
    signale.info("Begin compilation of " + path.basename(args.cpp, ".cpp"));
    await docker.compile(`external/${path.basename(args.cpp, ".cpp")}`);
    signale.info("Stop and remove temporary container");
    await docker.stop();
    await docker.remove();
    // await new Promise(resolve => setTimeout(resolve, 2500));
    // await docker.stop();
    // await docker.remove();
    // const project = await EosProject.load(EosProject.DEFAULT_PROJECT);

    // console.log(project.session);
    // await project.start();
    // await project.stop();
  }
}
