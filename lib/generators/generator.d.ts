export interface GeneratorOptions {
    quiet: boolean;
    force: boolean;
    cwd: string;
}
export interface GeneratorInterface {
    generate(opts?: GeneratorOptions): Promise<void>;
}
export default abstract class Generator<T extends object> implements GeneratorInterface {
    options: GeneratorOptions & T;
    abstract readonly defaultConfig: T;
    readonly templateRoot: string;
    constructor();
    generate(opts: GeneratorOptions & T): Promise<void>;
    configure(): Promise<void>;
    validate(): Promise<void>;
    abstract install(): Promise<void>;
    abstract prompt(): Promise<T>;
    clone(template: string, ...destination: string[]): Promise<void>;
    prepare(...relative: string[]): Promise<void>;
    prepareFile(file: string): Promise<void>;
}
