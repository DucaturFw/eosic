import * as fs from "fs-extra";
import * as path from "path";
import * as inquirer from "inquirer";
import Generator from "./generator";
import EosProject, { EosContractConfig } from "../lib/eos-project";

export interface ContractGeneratorConfig {
  name: string;
  description: string;
  entry: string;
  version: string;
}

export class ContractGenerator extends Generator<ContractGeneratorConfig> {
  get defaultConfig(): ContractGeneratorConfig {
    const slugName = this.options.name;
    return {
      name: slugName,
      entry: `${slugName}.cpp`,
      description: "Generic EOS contract",
      version: "0.0.1.1"
    };
  }

  get contractsPath(): string {
    return path.resolve(path.join(this.options.cwd, "contracts"));
  }

  async validate() {
    if (!await fs.pathExists(this.contractsPath)) {
      throw new Error("Path to contracts folder not found");
    }

    if (
      !this.options.force &&
      (await fs.pathExists(path.join(this.contractsPath, this.options.name)))
    ) {
      throw new Error(
        "Contract already created. Please use --force to override it (be carryful)"
      );
    }
  }

  async install(): Promise<void> {
    const project = await EosProject.load(this.options.cwd);
    await this.clone("contract", this.contractsPath, this.options.name);
    await this.prepare(this.contractsPath, this.options.name);

    await project.addContract(<EosContractConfig>this.options);
  }
  async prompt(): Promise<ContractGeneratorConfig> {
    return inquirer.prompt<ContractGeneratorConfig>([
      {
        name: "description",
        message: "Contract description",
        default: this.options.description
      }
    ]);
  }
}
