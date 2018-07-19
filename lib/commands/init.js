"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const generator_command_1 = require("./internal/generator-command");
const project_generator_1 = require("../generators/project-generator");
class Init extends generator_command_1.default {
    constructor() {
        super(...arguments);
        this.type = new project_generator_1.ProjectGenerator();
    }
}
Init.flags = Object.assign({}, generator_command_1.default.flags, { description: command_1.flags.string({ char: "d" }), withBuiltin: command_1.flags.boolean({ char: "b" }) });
Init.description = "Initialize EOSIC project";
exports.default = Init;
