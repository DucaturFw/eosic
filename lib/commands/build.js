"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const base_command_1 = require("./internal/base-command");
const docker_1 = require("../lib/docker");
const eos_docker_1 = require("../lib/eos-docker");
const signale = require("signale");
const path = require("path");
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
        const docker = await docker_1.default.create(eos_docker_1.default, {
            cwd: flags.cwd,
            container: {
                binds: {
                    "/contracts/external": path.dirname(path.isAbsolute(args.cpp)
                        ? args.cpp
                        : path.resolve(flags.cwd, args.cpp))
                }
            },
            stderr: true,
            stdout: !!flags.verbose
        });
        if (args.cpp.indexOf(".cpp") === -1) {
            throw new Error("File should be .cpp");
        }
        signale.info("Start and create temporary building contrainer");
        await docker.start();
        signale.info("Wait for healthy check");
        await docker.healthy();
        signale.info("Begin compilation of " + path.basename(args.cpp, ".cpp"));
        await docker.compile(`external/${path.basename(args.cpp, ".cpp")}`);
        if (!flags.ignoreAbi) {
            await docker.abigen(`external/${path.basename(args.cpp, ".cpp")}`);
        }
        signale.info("Stop and remove temporary container");
        await docker.stop();
        await docker.remove();
        // await new Promise(resolve => setTimeout(resolve, 2500));
        // await docker.stop();
        // await docker.remove();
        // const project = await EosProject.load(EosProject.DEFAULT_PROJECT);
        // console.log(project.session);
        // await project.start();
        // await project.stop();
    }
}
Compile.args = [
    {
        name: "cpp",
        required: true
    }
];
Compile.flags = Object.assign({ ignoreAbi: command_1.flags.boolean({ char: "a" }) }, base_command_1.default.flags);
Compile.description = `Build providen file as eosio contract`;
Compile.examples = ["$ eosic build <your-contract.cpp>"];
exports.default = Compile;
