"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs-extra");
const dirsum = require("dirsum");
const docker_wrapper_1 = require("./docker-wrapper");
const signale = require("signale");
class EosContract {
    constructor(root, config) {
        if (!path.isAbsolute(root)) {
            throw new Error("Path should be absolute");
        }
        this.configuration = config;
        this.root = root;
    }
    async digest() {
        return new Promise((resolve, reject) => {
            dirsum.digest(this.root, "md5", (err, hashes) => {
                if (err) {
                    reject(err);
                }
                resolve(hashes.hash);
            });
        });
    }
}
exports.EosContract = EosContract;
class EosProject {
    constructor(root, config) {
        this.contracts = {};
        if (!path.isAbsolute(root)) {
            throw new Error("Path should be absolute");
        }
        this.configuration = config;
        this.root = root;
    }
    static async load(root) {
        const _configPath = path.join(root, "eosic.json");
        const configPath = path.isAbsolute(_configPath) ? _configPath : path.resolve(_configPath);
        const configContent = await fs.readFile(configPath, "utf8");
        const config = JSON.parse(configContent);
        return new EosProject(root, config);
    }
    get configPath() {
        return path.resolve(this.root, "eosic.json");
    }
    get contractsPath() {
        return path.resolve(this.root, "contracts");
    }
    sanitizeContractConfig(original) {
        const { name, version, description, entry, checksum } = original;
        return {
            name,
            version,
            description,
            entry,
            checksum
        };
    }
    async addContract(_config) {
        const config = this.sanitizeContractConfig(_config);
        const { name } = config;
        const contractRoot = path.join(this.contractsPath, name);
        if (!await fs.pathExists(contractRoot)) {
            throw new Error("Contract not found in project");
        }
        this.configuration.contracts[name] = config;
        this.contracts[name] = new EosContract(contractRoot, config);
        await this.save();
    }
    getContract(name) {
        if (!this.configuration.contracts[name]) {
            throw new Error(`Contract ${name} not found in project`);
        }
        if (!this.contracts[name]) {
            this.contracts[name] = new EosContract(path.join(this.contractsPath, name), this.configuration.contracts[name]);
        }
        return this.contracts[name];
    }
    async save() {
        const json = JSON.stringify(this.configuration, null, 2);
        await fs.writeFile(this.configPath, json);
    }
    async start(log = true) {
        if (!this.session) {
            this.session = await docker_wrapper_1.DockerEOS.create(this.root);
            return this.session.start(log);
        }
    }
    async stop() {
        if (this.session) {
            await this.session.stop();
            await this.session.remove();
        }
    }
    async compile(contractName) {
        const contract = this.getContract(contractName);
        const hash = await contract.digest();
        // compile if it needed
        if (this.configuration.contracts[contractName].checksum !== hash) {
            if (!this.session) {
                await this.start(false);
            }
            signale.info(`Starting compilation of ${contractName}`);
            const output = await this.session.compile(contractName);
            output.split("\n").forEach(line => signale.debug(line));
            const compiledHash = await contract.digest();
            this.configuration.contracts[contractName].checksum = compiledHash;
        }
        else {
            signale.info(`${contractName} is up to date`);
        }
    }
}
exports.default = EosProject;
