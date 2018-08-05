import { Command, flags } from "@oclif/command";
import BaseCommand from "./internal/base-command";
import EosProject from "../lib/eos-project";

const MAX_CONSTRACTS_COUNT = 15;

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
  static args = makeContractPaths(MAX_CONSTRACTS_COUNT);
  static flags = BaseCommand.flags;

  async run() {
    const { args, flags } = this;
    let contracts = Array(MAX_CONSTRACTS_COUNT)
      .fill(0)
      .map((_, index) => args[index])
      .filter(contract => contract != undefined);

    const project = await EosProject.load(flags.cwd, {
      stdout: !!flags.verbose,
      stderr: true
    });

    if (!contracts.length) {
      contracts = Object.keys(project.configuration.contracts);
    }

    for (let contract of contracts) {
      await project.compile(contract);
    }

    await project.stop();
    await project.save();
  }
}
