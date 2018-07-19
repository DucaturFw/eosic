"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const path = require("path");
class BaseCommand extends command_1.Command {
    async init() {
        const { flags, args } = this.parse(this.constructor);
        this.flags = flags;
        this.args = args;
    }
}
BaseCommand.flags = {
    help: command_1.flags.help({ char: "h" }),
    quiet: command_1.flags.boolean({
        char: "q",
        description: "runs in quiet (non-interactive) mode"
    }),
    force: command_1.flags.boolean({ char: "f" }),
    verbose: command_1.flags.boolean({ char: "v" }),
    cwd: command_1.flags.string({
        char: "c",
        description: "custom work directory (default is current directory)",
        default: path.resolve(process.cwd()),
        parse: input => path.resolve(input)
    })
};
exports.default = BaseCommand;
