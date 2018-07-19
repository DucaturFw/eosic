import { flags } from "@oclif/command";
import GeneratorCommand from "./internal/generator-command";
import { ProjectGenerator } from "../generators/project-generator";
export default class Init extends GeneratorCommand {
    static flags: {
        description: flags.IOptionFlag<string | undefined>;
        withBuiltin: import("../../node_modules/@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        help: import("../../node_modules/@oclif/parser/lib/flags").IBooleanFlag<void>;
        quiet: import("../../node_modules/@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        force: import("../../node_modules/@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        verbose: import("../../node_modules/@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        cwd: flags.IOptionFlag<string | undefined>;
    };
    type: ProjectGenerator;
    static description: string;
}
