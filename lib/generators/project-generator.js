"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const generator_1 = require("./generator");
const inquirer = require("inquirer");
const slug = require("slug");
class ProjectGenerator extends generator_1.default {
    get defaultConfig() {
        const slugName = path.basename(this.options.cwd);
        return {
            name: slugName,
            description: "Generic EOSIC project",
            withBuiltin: true
        };
    }
    async install() {
        await this.clone("project", ".");
        if (this.options.withBuiltin) {
            await this.clone("builtin", ".", "builtin");
        }
        await this.prepare();
    }
    async prompt() {
        return inquirer.prompt([
            {
                name: "name",
                message: "Project name",
                default: this.options.name,
                transformer: (input) => slug(input)
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
exports.ProjectGenerator = ProjectGenerator;
