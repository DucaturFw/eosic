import * as dockerode from "dockerode";
import { DeepPartial } from "../utils";
export interface IDockerExecuteOptions {
    Cmd: string[];
    Env?: string[];
    AttachStdout?: boolean;
    AttachStderr?: boolean;
    Tty?: boolean;
    stream?: boolean;
}
export interface IDockerImageOptions {
    repository: string;
    tag: string;
}
export interface IDockerContainerOptions {
    name: string;
    command: string[];
    expose: number[];
    hostname: string;
    labels: {
        [key: string]: string;
    };
    ports: {
        [internal: string]: number;
    };
    binds: {
        [hostOrVolume: string]: string | (() => string);
    };
    removeVolumes: boolean;
    onBegin: string[];
}
export interface IDockerOptions {
    cwd: string;
    stderr: boolean;
    stdout: boolean;
    container: IDockerContainerOptions;
    image: IDockerImageOptions;
    onStart: string[];
    onStop: string[];
    logs: (message?: any, ...optionalParams: any[]) => void;
    errors: (message?: any, ...optionalParams: any[]) => void;
}
declare type IOptionsRequirements<T> = {
    [P in keyof T]: boolean | IOptionsRequirements<T[P]>;
};
export declare const DockerRequirements: IOptionsRequirements<IDockerOptions>;
export default abstract class Docker {
    options: IDockerOptions;
    dockerode: dockerode;
    imageInfo?: dockerode.ImageInfo;
    containerInfo?: dockerode.ContainerInfo;
    container?: dockerode.Container;
    abstract defaultOptions(): DeepPartial<IDockerOptions>;
    optionsAssert<T>(options: DeepPartial<T>, requirements: IOptionsRequirements<T>, prefix?: string): void;
    mergeOptions(...args: any[]): IDockerOptions;
    constructor(options?: DeepPartial<IDockerOptions>);
    static create<T extends Docker>(ctor: new (options?: DeepPartial<IDockerOptions>) => T, options?: DeepPartial<IDockerOptions>): Promise<T>;
    initialize(): Promise<Docker>;
    readonly ready: dockerode.Container | undefined;
    readonly imageRepository: string;
    readonly containerExposedPorts: {
        [port: string]: {};
    };
    readonly containerPortBindings: {
        [portAndProtocol: string]: {
            [index: string]: string;
        }[];
    };
    readonly containerBinds: string[];
    readonly containerCommands: string[];
    private findImage;
    private createContainer;
    private transferStd;
    private transferStream;
    start(): Promise<any>;
    stop(): Promise<any>;
    remove(): Promise<any>;
    exec(...args: string[]): Promise<void>;
    healthy(): Promise<boolean>;
}
export {};
