"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs-extra");
const dirsum = require("dirsum");
const signale = require("signale");
const docker_1 = require("./docker");
const eos_docker_1 = require("./eos-docker");
const deepmerge = require("deepmerge");
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
    constructor(root, config, dockerOptions) {
        this.contracts = {};
        if (!path.isAbsolute(root)) {
            throw new Error("Path should be absolute");
        }
        this.configuration = config;
        this.root = root;
        this.dockerOptions = dockerOptions;
    }
    static async load(root, dockerOptions) {
        const _configPath = path.join(root, "eosic.json");
        const configPath = path.isAbsolute(_configPath)
            ? _configPath
            : path.resolve(_configPath);
        const configContent = await fs.readFile(configPath, "utf8");
        const config = JSON.parse(configContent);
        return new EosProject(root, config, dockerOptions);
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
        if (!(await fs.pathExists(contractRoot))) {
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
            this.session = await docker_1.default.create(eos_docker_1.default, deepmerge({
                cwd: this.root,
                container: {
                    binds: {
                        "/contracts": this.contractsPath
                    }
                }
            }, this.dockerOptions || {}));
            await this.session.start();
            return this.session.healthy();
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
        const config = this.configuration.contracts[contractName];
        if (config.checksum !== hash) {
            if (!this.session) {
                await this.start(false);
            }
            signale.info(`Starting compilation of ${contractName}`);
            await this.session.compile(`${contractName}/${contractName}`);
            if (config.ignoreAbi) {
                await this.session.abigen(`${contractName}/${contractName}`);
            }
            const compiledHash = await contract.digest();
            config.checksum = compiledHash;
        }
        else {
            signale.info(`${contractName} is up to date`);
        }
    }
}
EosProject.DEFAULT_PROJECT = path.resolve(__dirname, "..", "..", "default");
exports.default = EosProject;
