import { Input } from "@oclif/parser";
import { Command, flags } from "@oclif/command";
import * as path from "path";

export default abstract class BaseCommand extends Command {
  static flags = {
    help: flags.help({ char: "h" }),
    quiet: flags.boolean({
      char: "q",
      description: "runs in quiet (non-interactive) mode"
    }),
    force: flags.boolean({ char: "f" }),
    verbose: flags.boolean({ char: "v" }),
    cwd: flags.string({
      char: "c",
      description: "custom work directory (default is current directory)",
      default: path.resolve(process.cwd()),
      parse: input => path.resolve(input)
    })
  };

  // TODO: type it (how? :))
  flags: any;
  // TODO: type it
  args: any;

  async init() {
    const { flags, args } = this.parse(this.constructor as Input<any>);
    this.flags = flags;
    this.args = args;
  }
}
