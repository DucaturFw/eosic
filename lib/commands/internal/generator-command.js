"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_command_1 = require("./base-command");
class GeneratorCommand extends base_command_1.default {
    async run() {
        const { args, flags } = this;
        // make generator options from args and flags
        await this.type.generate(Object.assign({}, flags, args));
    }
}
GeneratorCommand.flags = base_command_1.default.flags;
exports.default = GeneratorCommand;
