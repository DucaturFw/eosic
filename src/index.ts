import * as fs from "fs-extra";
import * as path from "path";
import EosProject from "./lib/eos-project";
import axios from "axios";

export { EosProject };

import { EosInstance, Name, IEosContract } from "eosjs";
export { run } from "@oclif/command";

export function createAccount(
  eos: any,
  pub: string,
  name: string,
  creator?: string
): Promise<void> {
  creator = creator || "eosio";
  return eos.newaccount({
    creator: creator,
    name: name,
    owner: pub,
    active: pub
  });
}
export async function start(opts?: any): Promise<EosProject> {
  const options = {
    cwd: opts.cwd || process.cwd(),
    logs: opts.logs
  };

  const project = await EosProject.load(options.cwd);
  await project.start(options.logs);

  let success = false;
  let tries = 0;
  while (!success && tries < 10) {
    tries++;
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
      const responce = await axios.get("http://0.0.0.0:8888/v1/chain/get_info");
      success = true;
    } catch (e) {
      console.error(`waiting for a node (${tries} try)`);
    }
  }

  return project;
}

function require_permissions(
  account: Name,
  key: string,
  actor: Name,
  parent: string
) {
  return {
    account: `${account}`,
    permission: "active",
    parent: `${parent}`,
    auth: {
      threshold: 1,
      keys: [
        {
          key: `${key}`,
          weight: 1
        }
      ],
      accounts: [
        {
          permission: {
            actor: `${actor}`,
            permission: "eosio.code"
          },
          weight: 1
        }
      ],
      waits: []
    }
  };
}

export function allowContract(
  eos: EosInstance,
  auth: string,
  pub: string,
  contract: Name,
  parent: string = "owner"
) {
  let [account, permission] = auth.split("@");
  permission = permission || "active";
  parent = parent || "owner";

  return eos.transaction({
    actions: [
      {
        account: "eosio",
        name: "updateauth",
        authorization: [
          {
            actor: account,
            permission: permission
          }
        ],
        data: require_permissions(account, pub, contract, parent)
      }
    ]
  });
}

export async function createContract<T extends IEosContract>(
  pub: string,
  eos: EosInstance,
  name: string,
  opts: any = {}
): Promise<{
  account: string;
  contract: T;
  setcode: any;
  setabi: any;
}> {
  const options = {
    cwd: process.cwd(),
    contractName: null,
    logs: false,
    creator: "eosio",
    ...opts
  };

  const charMap = ["a", "b", "c", "d", "e", "f", "g", "h", "k", "l", "m"];
  const pid = Math.floor(Math.random() * 10000)
    .toString()
    .split("")
    .map(char => charMap[parseInt(char)])
    .join("");

  const contractName = options.contractName || `${pid}${name}`.slice(0, 12);

  const wasm = fs.readFileSync(
    path.join(options.cwd, `contracts/${name}/${name}.wasm`)
  );

  const abi = fs.readFileSync(
    path.join(options.cwd, `contracts/${name}/${name}.abi`),
    "utf8"
  );

  const account = await createAccount(eos, pub, contractName, opts.creator);

  const setcode = await eos.setcode(contractName, 0, 0, wasm);
  const setabi = await eos.setabi(contractName, JSON.parse(abi));
  const contract = await eos.contract<T>(contractName);
  return {
    account: contractName,
    contract,
    setcode,
    setabi
  };
}

function deepJson(input: { [index: string]: any }): string {
  const output: { [index: string]: string | number | Buffer } = {};
  for (const key in input) {
    let value = input[key];
    if (typeof value === "object") {
      value = deepJson(value);
    }

    output[key] = value;
  }

  return JSON.stringify(output);
}

export function payload(input: { [index: string]: any }): string {
  return deepJson(input);
}
