"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const path = require("path");
const eos_project_1 = require("./lib/eos-project");
exports.EosProject = eos_project_1.default;
const axios_1 = require("axios");
const Eos = require("eosjs");
const { ecc } = Eos.modules;
var command_1 = require("@oclif/command");
exports.run = command_1.run;
function createAccount(eos, pub, name) {
    return eos.newaccount({
        creator: "eosio",
        name: name,
        owner: pub,
        active: pub
    });
}
exports.createAccount = createAccount;
async function start(opts) {
    const options = {
        cwd: opts.cwd || process.cwd(),
        logs: opts.logs
    };
    const project = await eos_project_1.default.load(options.cwd);
    await project.start(options.logs);
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
    return project;
}
exports.start = start;
async function createContract(pub, eos, name, opts = {}) {
    const options = Object.assign({ cwd: process.cwd(), contractName: null, logs: false }, opts);
    const charMap = ["a", "b", "c", "d", "e", "f", "g", "h", "k", "l", "m"];
    const pid = Math.floor(Math.random() * 10000)
        .toString()
        .split("")
        .map(char => charMap[parseInt(char)])
        .join("");
    const contractName = options.contractName || `${pid}${name}`.slice(0, 12);
    const wasm = fs.readFileSync(path.join(options.cwd, `contracts/${name}/${name}.wasm`));
    const abi = fs.readFileSync(path.join(options.cwd, `contracts/${name}/${name}.abi`), "utf8");
    const account = await eos.newaccount({
        creator: "eosio",
        name: contractName,
        owner: pub,
        active: pub
    });
    await eos.setcode(contractName, 0, 0, wasm);
    await eos.setabi(contractName, JSON.parse(abi));
    const contract = await eos.contract(contractName);
    return {
        account: contractName,
        contract
    };
}
exports.createContract = createContract;
function deepJson(input) {
    const output = {};
    for (const key in input) {
        let value = input[key];
        if (typeof value === "object") {
            value = deepJson(value);
        }
        output[key] = value;
    }
    return JSON.stringify(output);
}
function payload(input) {
    return deepJson(input);
}
exports.payload = payload;
