import * as path from "path";
import Generator from "./generator";
import * as inquirer from "inquirer";
import * as slug from "slug";

export interface ProjectGeneratorConfig {
  name: string;
  description: string;
  withBuiltin: boolean;
}

export class ProjectGenerator extends Generator<ProjectGeneratorConfig> {
  get defaultConfig(): ProjectGeneratorConfig {
    const slugName = path.basename(this.options.cwd);
    return {
      name: slugName,
      description: "Generic EOSIC project",
      withBuiltin: true
    };
  }

  async install(): Promise<void> {
    await this.clone("project", ".");
    if (this.options.withBuiltin) {
      await this.clone("builtin", ".", "builtin");
    }
    await this.prepare();
  }

  async prompt(): Promise<ProjectGeneratorConfig> {
    return inquirer.prompt<ProjectGeneratorConfig>([
      {
        name: "name",
        message: "Project name",
        default: this.options.name,
        transformer: (input: any) => slug(input)
      },
      {
        name: "description",
        message: "Project description",
        default: this.options.description
      },
      {
        type: "list",
        name: "withBuiltin",
        message: "Add default EOS contracts to project?",
        choices: [{ name: "yes", value: true }, { name: "no", value: false }]
      }
    ]);
  }
}
