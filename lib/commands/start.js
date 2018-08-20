"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_command_1 = require("./internal/base-command");
const eos_project_1 = require("../lib/eos-project");
const globby = require("globby");
const path = require("path");
const death = require("death");
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
class Start extends base_command_1.default {
    async run() {
        const { args, flags } = this;
        const project = await eos_project_1.default.load(this.flags.cwd, {
            stderr: true,
            stdout: !!flags.verbose,
            image: {
                repository: "eosio/eos-dev",
                tag: "latest"
            }
        });
        death(async () => {
            await project.stop();
            process.exit();
        });
        await project.start();
        const scripts = await globby("migrate/*.js", {
            cwd: this.flags.cwd
        });
        for (let script of scripts) {
            try {
                const method = require(path.resolve(this.flags.cwd, script));
                await method.default();
            }
            catch (e) {
                console.error(e);
            }
        }
        while (true) {
            await sleep(1000);
        }
    }
}
Start.flags = base_command_1.default.flags;
exports.default = Start;
