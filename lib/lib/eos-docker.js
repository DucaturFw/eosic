"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const docker_1 = require("./docker");
const axios_1 = require("axios");
const signale = require("signale");
exports.binariesPath = path.resolve(__dirname, "..", "..", "bin");
exports.defaultProjectPath = path.resolve(__dirname, "..", "..", "templates", "project");
class EosDocker extends docker_1.default {
    defaultOptions() {
        return {
            cwd: process.cwd(),
            image: {
                repository: "eosio/eos-dev",
                tag: "v1.1.1"
            },
            container: {
                name: `eosic-${(Math.random() * 0xffffff) >> 0}`,
                binds: {
                    "/opt/eosio/bin/data-dir/config.ini": exports.defaultProjectPath + "/config.ini",
                    "/.bashrc": exports.binariesPath + "/.bashrc",
                    "/eosiocppfix": exports.binariesPath + "/eosiocppfix",
                    "/compile": exports.binariesPath + "/compile"
                },
                command: [
                    "/opt/eosio/bin/nodeosd.sh --data-dir /opt/eosio/bin/data-dir -e --contracts-console"
                ],
                expose: [8888, 9876],
                hostname: "test",
                labels: {
                    eosic: "true",
                    "eosic.version": "0.0.1"
                },
                ports: {
                    "8888": 8888,
                    "9876": 9876
                },
                removeVolumes: true
            },
            stdout: true,
            stderr: true,
            onStart: ["chmod +x /compile", "chmod +x /eosiocppfix"],
            logs(msg, ...args) {
                msg.split("\n").forEach((line) => {
                    signale.debug(`[${this.options.container.name}]: ${line}`);
                });
            },
            errors(msg, ...args) {
                msg.split("\n").forEach((line) => {
                    signale.warn(`[${this.options.container.name}]: ${line}`);
                });
            }
        };
    }
    async compile(path) {
        // return this.exec("eosio-cpp ");
        return this.exec(`bash`, `-c`, `/compile ${path}`);
    }
    async healthy() {
        if (!(await super.healthy())) {
            return false;
        }
        let success = false;
        let tries = 0;
        while (!success && tries < 3) {
            tries++;
            await new Promise(resolve => setTimeout(resolve, 1000));
            try {
                const responce = await axios_1.default.get("http://0.0.0.0:8888/v1/chain/get_info");
                success = true;
            }
            catch (e) {
                console.error(`waiting for a node (${tries} try) - ${e}`);
            }
        }
        return success;
    }
}
exports.default = EosDocker;
