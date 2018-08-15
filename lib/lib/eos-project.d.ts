import { IDockerOptions } from "./docker";
import EosDocker from "./eos-docker";
import { DeepPartial } from "../utils";
export interface EosProjectConfig {
    name: string;
    version: string;
    description: string;
    tests: string;
    migrations: string;
    contracts: {
        [name: string]: EosContractConfig;
    };
}
export interface EosContractConfig {
    name: string;
    version: string;
    description: string;
    entry: string;
    checksum?: string;
    ignoreAbi?: boolean;
}
export declare class EosContract {
    root: string;
    configuration: EosContractConfig;
    constructor(root: string, config: EosContractConfig);
    digest(): Promise<string>;
}
export declare type EosContractsCollection = {
    [name: string]: EosContract;
};
export default class EosProject {
    static DEFAULT_PROJECT: string;
    root: string;
    configuration: EosProjectConfig;
    private contracts;
    session: EosDocker;
    dockerOptions?: DeepPartial<IDockerOptions>;
    constructor(root: string, config: EosProjectConfig, dockerOptions?: DeepPartial<IDockerOptions>);
    static load(root: string, dockerOptions?: DeepPartial<IDockerOptions>): Promise<EosProject>;
    readonly configPath: string;
    readonly contractsPath: string;
    private sanitizeContractConfig;
    addContract(_config: EosContractConfig): Promise<void>;
    getContract(name: string): EosContract;
    save(): Promise<void>;
    start(log?: boolean): Promise<any>;
    stop(): Promise<any>;
    compile(contractName: string): Promise<void>;
}
