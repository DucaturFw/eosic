import { flags } from "@oclif/command";
import { GeneratorInterface } from "../../generators/generator";
import BaseCommand from "./base-command";
export default abstract class GeneratorCommand extends BaseCommand {
    static flags: {
        help: import("../../../node_modules/@oclif/parser/lib/flags").IBooleanFlag<void>;
        quiet: import("../../../node_modules/@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        force: import("../../../node_modules/@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        verbose: import("../../../node_modules/@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        cwd: flags.IOptionFlag<string | undefined>;
    };
    abstract readonly type: GeneratorInterface;
    run(): Promise<void>;
}
