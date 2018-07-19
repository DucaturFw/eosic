"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_command_1 = require("./internal/base-command");
const eos_project_1 = require("../lib/eos-project");
const MAX_CONSTRACTS_COUNT = 15;
function makeContractPaths(count) {
    return Array(count)
        .fill(0)
        .map((_, index) => ({
        required: false,
        hidden: true,
        name: index.toString()
    }));
}
class Compile extends base_command_1.default {
    async run() {
        const { args, flags } = this;
        const contracts = Array(MAX_CONSTRACTS_COUNT)
            .fill(0)
            .map((_, index) => args[index])
            .filter(contract => contract != undefined);
        if (!contracts.length) {
            throw new Error("Define at least one contract to compile");
        }
        const project = await eos_project_1.default.load(flags.cwd);
        const tasks = contracts.map(contract => project.compile(contract));
        await Promise.all(tasks);
        await project.stop();
        await project.save();
    }
}
Compile.args = makeContractPaths(MAX_CONSTRACTS_COUNT);
Compile.flags = base_command_1.default.flags;
exports.default = Compile;
