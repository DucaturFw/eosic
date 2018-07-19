import { Command, flags } from "@oclif/command";
export default abstract class BaseCommand extends Command {
    static flags: {
        help: import("../../../node_modules/@oclif/parser/lib/flags").IBooleanFlag<void>;
        quiet: import("../../../node_modules/@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        force: import("../../../node_modules/@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        verbose: import("../../../node_modules/@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        cwd: flags.IOptionFlag<string | undefined>;
    };
    flags: any;
    args: any;
    init(): Promise<void>;
}
