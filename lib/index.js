"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const path = require("path");
const eos_project_1 = require("./lib/eos-project");
exports.EosProject = eos_project_1.default;
const axios_1 = require("axios");
var command_1 = require("@oclif/command");
exports.run = command_1.run;
function createAccount(eos, pub, name, creator) {
    creator = creator || "eosio";
    return eos.newaccount({
        creator: creator,
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
function require_permissions(account, key, actor, parent) {
    return {
        account: `${account}`,
        permission: "active",
        parent: `${parent}`,
        auth: {
            threshold: 1,
            keys: [
                {
                    key: `${key}`,
                    weight: 1
                }
            ],
            accounts: [
                {
                    permission: {
                        actor: `${actor}`,
                        permission: "eosio.code"
                    },
                    weight: 1
                }
            ],
            waits: []
        }
    };
}
function allowContract(eos, auth, pub, contract, parent = "owner") {
    let [account, permission] = auth.split("@");
    permission = permission || "active";
    parent = parent || "owner";
    return eos.transaction({
        actions: [
            {
                account: "eosio",
                name: "updateauth",
                authorization: [
                    {
                        actor: account,
                        permission: permission
                    }
                ],
                data: require_permissions(account, pub, contract, parent)
            }
        ]
    });
}
exports.allowContract = allowContract;
async function createContract(pub, eos, name, opts = {}) {
    const options = Object.assign({ cwd: process.cwd(), contractName: null, logs: false, creator: "eosio" }, opts);
    const charMap = ["a", "b", "c", "d", "e", "f", "g", "h", "k", "l", "m"];
    const pid = Math.floor(Math.random() * 10000)
        .toString()
        .split("")
        .map(char => charMap[parseInt(char)])
        .join("");
    const contractName = options.contractName || `${pid}${name}`.slice(0, 12);
    const wasm = fs.readFileSync(path.join(options.cwd, `contracts/${name}/${name}.wasm`));
    const abi = fs.readFileSync(path.join(options.cwd, `contracts/${name}/${name}.abi`), "utf8");
    const account = await createAccount(eos, pub, contractName, opts.creator);
    const setcode = await eos.setcode(contractName, 0, 0, wasm);
    const setabi = await eos.setabi(contractName, JSON.parse(abi));
    const contract = await eos.contract(contractName);
    return {
        account: contractName,
        contract,
        setcode,
        setabi
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
