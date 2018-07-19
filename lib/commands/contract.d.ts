import { flags } from "@oclif/command";
import GeneratorCommand from "./internal/generator-command";
import { ContractGenerator } from "../generators/contract-generator";
export default class Contract extends GeneratorCommand {
    static args: {
        name: string;
        description: string;
        required: boolean;
        parse: (input: any) => string;
    }[];
    static flags: {
        description: flags.IOptionFlag<string | undefined>;
        withBuiltin: import("../../node_modules/@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        help: import("../../node_modules/@oclif/parser/lib/flags").IBooleanFlag<void>;
        quiet: import("../../node_modules/@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        force: import("../../node_modules/@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        verbose: import("../../node_modules/@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        cwd: flags.IOptionFlag<string | undefined>;
    };
    type: ContractGenerator;
    static description: string;
}
