import * as dockerode from "dockerode";
export declare const DEFAULT_IMAGE_REPO = "eosic/environment";
export declare const DEFAULT_IMAGE_TAG = "latest";
export interface DockerExecuteOptions {
    Cmd: string[];
    Env?: string[];
    AttachStdout?: boolean;
    AttachStderr?: boolean;
    Tty?: boolean;
    stream?: boolean;
}
export interface DockerEOSCreateConfig {
    imageConfig?: DockerEOSImageConfig;
}
export interface DockerEOSImageConfig {
    repository: string;
    tag: string;
}
export interface DockerEOSContainerConfig {
    id?: string;
}
export interface DockerEOSConfig {
    image: DockerEOSImageConfig;
}
export declare enum CreateImageAnswerEnum {
    Yes = 0,
    Prebuild = 1,
    Cancel = 2
}
export interface CreateImageAnswer {
    answer: number;
}
export declare class DockerEOS {
    _config: DockerEOSConfig;
    _docker: dockerode;
    _imageInfo?: dockerode.ImageInfo;
    _containerInfo?: dockerode.ContainerInfo;
    _image?: dockerode.Image;
    _container?: dockerode.Container;
    _cwd: string;
    ready: boolean;
    constructor(cwd?: string, imageCfg?: DockerEOSImageConfig);
    static create(cwd?: string, config?: DockerEOSCreateConfig): Promise<DockerEOS>;
    initialize(): Promise<void>;
    findImage(): Promise<void>;
    askAndCreateImage(): Promise<void>;
    createImage(opts: {
        [name: string]: any;
    }): Promise<void>;
    selectImage(): Promise<void>;
    findContainer(): Promise<void>;
    start(log: boolean): Promise<any>;
    stop(): Promise<any>;
    remove(): Promise<any>;
    exec(...args: string[]): Promise<string>;
    compile(name: string): Promise<string>;
}
