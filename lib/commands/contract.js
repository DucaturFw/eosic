"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const slug = require("slug");
const command_1 = require("@oclif/command");
const generator_command_1 = require("./internal/generator-command");
const contract_generator_1 = require("../generators/contract-generator");
class Contract extends generator_command_1.default {
    constructor() {
        super(...arguments);
        this.type = new contract_generator_1.ContractGenerator();
    }
}
Contract.args = [
    {
        name: "name",
        description: "Name of generated contract",
        required: true,
        parse: (input) => slug(input)
    }
];
Contract.flags = Object.assign({}, generator_command_1.default.flags, { description: command_1.flags.string({ char: "d" }), withBuiltin: command_1.flags.boolean({ char: "b" }) });
Contract.description = "create new contract";
exports.default = Contract;
