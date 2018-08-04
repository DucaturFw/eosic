import * as path from "path";
import Docker, { IDockerOptions } from "./docker";
import { DeepPartial } from "../utils";
import chalk from "chalk";

export const binariesPath = path.resolve(__dirname, "..", "..", "bin");

export default class EosDocker extends Docker {
  defaultOptions(): DeepPartial<IDockerOptions> {
    return {
      cwd: process.cwd(),
      image: {
        repository: "eosio/eos-dev",
        tag: "latest"
      },
      container: {
        name: `eosic-${(Math.random() * 0xffffff) >> 0}`,
        binds: {
          "/opt/eosio/bin/data-dir/config.ini": () =>
            `${this.options.cwd}/config.ini`,
          "/contracts": () => `${this.options.cwd}/contracts`,
          "/.bashrc": binariesPath + "/.bashrc",
          "/eosiocppfix": binariesPath + "/eosiocppfix",
          "/compile": binariesPath + "/compile"
        },
        command: [
          "/opt/eosio/bin/nodeosd.sh --data-dir /opt/eosio/bin/data-dir -e --contracts-console"
        ],
        expose: [8888, 9876],
        hostname: "test",
        labels: {
          eosic: "true",
          "eosic.version": "0.0.1"
        },
        ports: {
          "8888": 8888,
          "9876": 9876
        },
        removeVolumes: true
      },
      stdout: true,
      onStart: ["chmod +x /compile", "chmod +x /eosiocppfix"],
      logs(msg: any, ...args: any[]) {
        msg.split("\n").forEach((line: string) => {
          console.log(
            chalk.gray(`[${(<Docker>this).options.container!.name}]: ${line}`)
          );
        });
      },
      errors(msg: any, ...args: any[]) {
        msg.split("\n").forEach((line: string) => {
          console.log(
            chalk.red(`[${(<Docker>this).options.container!.name}]: ${line}`)
          );
        });
      }
    };
  }
}
