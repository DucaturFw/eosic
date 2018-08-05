import Docker, { IDockerOptions } from "./docker";
import { DeepPartial } from "../utils";
export declare const binariesPath: string;
export declare const defaultProjectPath: string;
export default class EosDocker extends Docker {
    defaultOptions(): DeepPartial<IDockerOptions>;
    compile(path: string): Promise<void>;
    healthy(): Promise<boolean>;
}
