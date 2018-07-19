import Generator from "./generator";
export interface ContractGeneratorConfig {
    name: string;
    description: string;
    entry: string;
    version: string;
}
export declare class ContractGenerator extends Generator<ContractGeneratorConfig> {
    readonly defaultConfig: ContractGeneratorConfig;
    readonly contractsPath: string;
    validate(): Promise<void>;
    install(): Promise<void>;
    prompt(): Promise<ContractGeneratorConfig>;
}
