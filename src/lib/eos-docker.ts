import * as path from "path";
import Docker, { IDockerOptions } from "./docker";
import { DeepPartial } from "../utils";
import chalk from "chalk";
import axios from "axios";
import * as signale from "signale";

export const binariesPath = path.resolve(__dirname, "..", "..", "bin");
export const defaultProjectPath: string = path.resolve(
  __dirname,
  "..",
  "..",
  "templates",
  "project"
);

export default class EosDocker extends Docker {
  defaultOptions(): DeepPartial<IDockerOptions> {
    return {
      cwd: process.cwd(),
      image: {
        repository: "eosio/eos-dev",
        tag: "v1.1.1"
      },
      container: {
        name: `eosic-${(Math.random() * 0xffffff) >> 0}`,
        binds: {
          "/opt/eosio/bin/data-dir/config.ini":
            defaultProjectPath + "/config.ini",
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
      stderr: true,
      onStart: ["chmod +x /compile", "chmod +x /eosiocppfix"],
      logs(msg: any, ...args: any[]) {
        msg.split("\n").forEach((line: string) => {
          signale.debug(`[${(<Docker>this).options.container!.name}]: ${line}`);
        });
      },
      errors(msg: any, ...args: any[]) {
        msg.split("\n").forEach((line: string) => {
          signale.warn(`[${(<Docker>this).options.container!.name}]: ${line}`);
        });
      }
    };
  }

  async compile(path: string) {
    // return this.exec("eosio-cpp ");
    return this.exec(`bash`, `-c`, `/compile ${path}`);
  }

  async healthy(): Promise<boolean> {
    if (!(await super.healthy())) {
      return false;
    }

    let success = false;
    let tries = 0;
    while (!success && tries < 3) {
      tries++;
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        const responce = await axios.get(
          "http://0.0.0.0:8888/v1/chain/get_info"
        );
        success = true;
      } catch (e) {
        console.error(`waiting for a node (${tries} try) - ${e}`);
      }
    }

    return success;
  }
}
