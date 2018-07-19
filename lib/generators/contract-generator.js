"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const path = require("path");
const inquirer = require("inquirer");
const generator_1 = require("./generator");
const eos_project_1 = require("../lib/eos-project");
class ContractGenerator extends generator_1.default {
    get defaultConfig() {
        const slugName = this.options.name;
        return {
            name: slugName,
            entry: `${slugName}.cpp`,
            description: "Generic EOS contract",
            version: "0.0.1.1"
        };
    }
    get contractsPath() {
        return path.resolve(path.join(this.options.cwd, "contracts"));
    }
    async validate() {
        if (!await fs.pathExists(this.contractsPath)) {
            throw new Error("Path to contracts folder not found");
        }
        if (!this.options.force &&
            (await fs.pathExists(path.join(this.contractsPath, this.options.name)))) {
            throw new Error("Contract already created. Please use --force to override it (be carryful)");
        }
    }
    async install() {
        const project = await eos_project_1.default.load(this.options.cwd);
        await this.clone("contract", this.contractsPath, this.options.name);
        await this.prepare(this.contractsPath, this.options.name);
        await project.addContract(this.options);
    }
    async prompt() {
        return inquirer.prompt([
            {
                name: "description",
                message: "Contract description",
                default: this.options.description
            }
        ]);
    }
}
exports.ContractGenerator = ContractGenerator;
