import * as fs from "fs-extra";
import * as path from "path";
const Eos: any = require("eosjs");

const { ecc } = Eos.modules;

export { run } from "@oclif/command";
export async function createContract(
  pub: string,
  eos: any,
  name: string,
  opts: any = {}
) {
  const options = {
    cwd: process.cwd(),
    contractName: null,
    ...opts
  };

  const charMap = ["a", "b", "c", "d", "e", "f", "g", "h", "k", "l", "m"];
  const pid = Math.floor(Math.random() * 10000)
    .toString()
    .split("")
    .map(char => charMap[parseInt(char)])
    .join("");

  const contractName = options.contractName || `${pid}${name}`.slice(0, 12);
  console.log(contractName);

  const wasm = fs.readFileSync(
    path.resolve(options.cwd, `contracts/${name}/${name}.wasm`)
  );

  const abi = fs.readFileSync(
    path.resolve(options.cwd, `contracts/${name}/${name}.abi`),
    "utf8"
  );

  console.log("newaccount");
  const account = await eos.newaccount({
    creator: "eosio",
    name: contractName,
    owner: pub,
    active: pub
  });

  // await eos.transaction((tr: any) => {
  console.log("setcode");
  await eos.setcode(contractName, 0, 0, wasm);
  console.log("setabi");
  await eos.setabi(contractName, JSON.parse(abi));
  // });
  console.log("load contract at " + contractName);
  const contract = await eos.contract(contractName);
  return {
    account: contractName,
    contract
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
