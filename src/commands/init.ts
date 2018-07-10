import { Command, flags } from "@oclif/command";
import GeneratorCommand from "./internal/generator-command";
import {
  ProjectGenerator,
  ProjectGeneratorConfig
} from "../generators/project-generator";

export default class Init extends GeneratorCommand {
  static flags = {
    ...GeneratorCommand.flags,
    description: flags.string({ char: "d" }),
    withBuiltin: flags.boolean({ char: "b" })
  };

  type: ProjectGenerator = new ProjectGenerator();
  static description = "Initialize EOSIC project";
}
