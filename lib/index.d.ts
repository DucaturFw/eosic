import EosProject from "./lib/eos-project";
export { EosProject };
import { EosInstance, Name, IEosContract } from "eosjs";
export { run } from "@oclif/command";
export declare function createAccount(eos: any, pub: string, name: string, creator?: string): Promise<void>;
export declare function start(opts?: any): Promise<EosProject>;
export declare function allowContract(eos: EosInstance, auth: string, pub: string, contract: Name, parent?: string): Promise<any>;
export declare function createContract<T extends IEosContract>(pub: string, eos: EosInstance, name: string, opts?: any): Promise<{
    account: string;
    contract: T;
    setcode: any;
    setabi: any;
}>;
export declare function payload(input: {
    [index: string]: any;
}): string;
