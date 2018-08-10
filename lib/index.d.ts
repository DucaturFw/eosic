/// <reference path="../typings/eosjs/index.d.ts" />
import EosProject from "./lib/eos-project";
export { EosProject };
import { EosInstance, Name } from "eosjs";
export { run } from "@oclif/command";
export declare function createAccount(eos: any, pub: string, name: string, creator?: string): Promise<void>;
export declare function start(opts?: any): Promise<EosProject>;
export declare function allowContract(eos: EosInstance, auth: string, pub: string, contract: Name, parent?: string): Promise<any>;
export declare function createContract(pub: string, eos: EosInstance, name: string, opts?: any): Promise<{
    account: any;
    contract: import("eosjs").IEosContract;
    setcode: any;
    setabi: any;
}>;
export declare function payload(input: {
    [index: string]: any;
}): string;
