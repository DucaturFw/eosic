"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_command_1 = require("./internal/base-command");
const eos_project_1 = require("../lib/eos-project");
const globby = require("globby");
const axios_1 = require("axios");
const path = require("path");
const death = require("death");
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
class Start extends base_command_1.default {
    async run() {
        const project = await eos_project_1.default.load(this.flags.cwd);
        await project.start();
        let success = false;
        let tries = 0;
        while (!success && tries < 10) {
            tries++;
            await new Promise(resolve => setTimeout(resolve, 1000));
            try {
                const responce = await axios_1.default.get("http://0.0.0.0:8888/v1/chain/get_info");
                success = true;
            }
            catch (e) {
                console.error(`waiting for a node (${tries} try)`);
            }
        }
        const scripts = await globby("migrate/*.js", {
            cwd: this.flags.cwd
        });
        scripts.forEach(script => require(path.resolve(this.flags.cwd, script)));
        death(async () => {
            await project.stop();
            process.exit();
        });
        while (true) {
            await sleep(1000);
        }
    }
}
Start.flags = base_command_1.default.flags;
exports.default = Start;
