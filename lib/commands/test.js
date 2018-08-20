"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_command_1 = require("./internal/base-command");
const Mocha = require("mocha");
const globby = require("globby");
const path = require("path");
const eos_project_1 = require("../lib/eos-project");
class Test extends base_command_1.default {
    async run() {
        const { args, flags } = this;
        const project = await eos_project_1.default.load(flags.cwd, {
            stderr: true,
            stdout: !!flags.verbose,
            image: {
                repository: "eosio/eos-dev",
                tag: "latest"
            }
        });
        await project.start();
        const mocha = new Mocha();
        const tests = await globby(["test/**/*.test.js", "lib/**/*.test.js"], {
            cwd: flags.cwd
        });
        tests.forEach(test => {
            mocha.addFile(path.resolve(flags.cwd, test));
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
