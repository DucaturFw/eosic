import { Command, flags } from "@oclif/command";
import Generator, { GeneratorInterface } from "../../generators/generator";
import * as path from "path";
import BaseCommand from "./base-command";

export default abstract class GeneratorCommand extends BaseCommand {
  static flags = BaseCommand.flags;

  abstract readonly type: GeneratorInterface;

  async run() {
    const { args, flags } = this;
    // make generator options from args and flags
    await this.type.generate({
      ...flags,
      ...args
    });
  }
}
