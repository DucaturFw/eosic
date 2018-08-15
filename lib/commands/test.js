"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_command_1 = require("./internal/base-command");
const Mocha = require("mocha");
const globby = require("globby");
const path = require("path");
const eos_project_1 = require("../lib/eos-project");
async function sleep(sec) {
    return new Promise(resolve => setTimeout(resolve, sec * 1000));
}
class Test extends base_command_1.default {
    async run() {
        const project = await eos_project_1.default.load(this.flags.cwd);
        await project.start();
        const mocha = new Mocha();
        const tests = await globby(["test/**/*.test.js", "lib/**/*.test.js"], {
            cwd: this.flags.cwd
        });
        tests.forEach(test => {
            mocha.addFile(path.resolve(this.flags.cwd, test));
        });
        mocha.timeout(20000);
        try {
            mocha.run(async (failures) => {
                await project.stop();
                process.exitCode = failures ? -1 : 0; // exit with non-zero status if there were failures
            });
        }
        catch (e) {
            require("signale").fatal(e);
            await project.stop();
            process.exitCode = -1;
        }
    }
}
Test.flags = base_command_1.default.flags;
exports.default = Test;
