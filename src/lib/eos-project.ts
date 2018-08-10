import * as path from "path";
import * as fs from "fs-extra";
import * as globby from "globby";
import * as dirsum from "dirsum";
import { DockerEOS } from "./docker-wrapper";
import * as signale from "signale";
import Docker, { IDockerOptions } from "./docker";
import EosDocker from "./eos-docker";
import { DeepPartial } from "../utils";
import * as deepmerge from "deepmerge";

export interface EosProjectConfig {
  name: string;
  version: string;
  description: string;
  tests: string;
  migrations: string;
  contracts: { [name: string]: EosContractConfig };
}

export interface EosContractConfig {
  name: string;
  version: string;
  description: string;
  entry: string;
  checksum?: string;
  ignoreAbi?: boolean;
}

export class EosContract {
  root: string;
  configuration: EosContractConfig;

  constructor(root: string, config: EosContractConfig) {
    if (!path.isAbsolute(root)) {
      throw new Error("Path should be absolute");
    }

    this.configuration = config;
    this.root = root;
  }

  async digest(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      dirsum.digest(this.root, "md5", (err: any, hashes: any) => {
        if (err) {
          reject(err);
        }
        resolve(<string>hashes.hash);
      });
    });
  }
}

export type EosContractsCollection = { [name: string]: EosContract };

export default class EosProject {
  static DEFAULT_PROJECT: string = path.resolve(
    __dirname,
    "..",
    "..",
    "default"
  );
  root: string;
  configuration: EosProjectConfig;
  private contracts: EosContractsCollection = {};
  session!: EosDocker;
  dockerOptions?: DeepPartial<IDockerOptions>;

  constructor(
    root: string,
    config: EosProjectConfig,
    dockerOptions?: DeepPartial<IDockerOptions>
  ) {
    if (!path.isAbsolute(root)) {
      throw new Error("Path should be absolute");
    }

    this.configuration = config;
    this.root = root;
    this.dockerOptions = dockerOptions;
  }

  static async load(
    root: string,
    dockerOptions?: DeepPartial<IDockerOptions>
  ): Promise<EosProject> {
    const _configPath = path.join(root, "eosic.json");
    const configPath = path.isAbsolute(_configPath)
      ? _configPath
      : path.resolve(_configPath);
    const configContent = await fs.readFile(configPath, "utf8");
    const config = <EosProjectConfig>JSON.parse(configContent);
    return new EosProject(root, config, dockerOptions);
  }

  get configPath() {
    return path.resolve(this.root, "eosic.json");
  }

  get contractsPath() {
    return path.resolve(this.root, "contracts");
  }

  private sanitizeContractConfig(
    original: EosContractConfig
  ): EosContractConfig {
    const { name, version, description, entry, checksum } = original;
    return {
      name,
      version,
      description,
      entry,
      checksum
    };
  }

  async addContract(_config: EosContractConfig) {
    const config: EosContractConfig = this.sanitizeContractConfig(_config);
    const { name } = config;
    const contractRoot = path.join(this.contractsPath, name);
    if (!(await fs.pathExists(contractRoot))) {
      throw new Error("Contract not found in project");
    }

    this.configuration.contracts[name] = config;
    this.contracts[name] = new EosContract(contractRoot, config);

    await this.save();
  }

  getContract(name: string): EosContract {
    if (!this.configuration.contracts[name]) {
      throw new Error(`Contract ${name} not found in project`);
    }

    if (!this.contracts[name]) {
      this.contracts[name] = new EosContract(
        path.join(this.contractsPath, name),
        this.configuration.contracts[name]
      );
    }

    return this.contracts[name];
  }

  async save() {
    const json = JSON.stringify(this.configuration, null, 2);
    await fs.writeFile(this.configPath, json);
  }

  async start(log: boolean = true): Promise<any> {
    if (!this.session) {
      this.session = await Docker.create<EosDocker>(
        EosDocker,
        deepmerge(
          {
            cwd: this.root,
            container: {
              binds: {
                "/contracts": this.contractsPath
              }
            }
          },
          this.dockerOptions || {}
        )
      );

      await this.session.start();
      return this.session.healthy();
    }
  }

  async stop(): Promise<any> {
    if (this.session) {
      await this.session.stop();
      await this.session.remove();
    }
  }

  async compile(contractName: string): Promise<void> {
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
    } else {
      signale.info(`${contractName} is up to date`);
    }
  }
}
