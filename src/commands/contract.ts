import * as slug from "slug";
import { Command, flags } from "@oclif/command";
import GeneratorCommand from "./internal/generator-command";
import {
  ContractGenerator,
  ContractGeneratorConfig
} from "../generators/contract-generator";

export default class Contract extends GeneratorCommand {
  static args = [
    {
      name: "name",
      description: "Name of generated contract",
      required: true,
      parse: (input: any) => slug(input)
    }
  ];

  static flags = {
    ...GeneratorCommand.flags,
    description: flags.string({ char: "d" }),
    withBuiltin: flags.boolean({ char: "b" })
  };

  type: ContractGenerator = new ContractGenerator();
  static description = "create new contract";
}
