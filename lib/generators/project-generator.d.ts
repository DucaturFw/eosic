import Generator from "./generator";
export interface ProjectGeneratorConfig {
    name: string;
    description: string;
    withBuiltin: boolean;
}
export declare class ProjectGenerator extends Generator<ProjectGeneratorConfig> {
    readonly defaultConfig: ProjectGeneratorConfig;
    install(): Promise<void>;
    prompt(): Promise<ProjectGeneratorConfig>;
}
