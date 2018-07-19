import EosProject from "./lib/eos-project";
export { EosProject };
export { run } from "@oclif/command";
export declare function start(opts?: any): Promise<EosProject>;
export declare function createContract(pub: string, eos: any, name: string, opts?: any): Promise<{
    account: any;
    contract: any;
}>;
export declare function payload(input: {
    [index: string]: any;
}): string;
