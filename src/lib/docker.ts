import { PassThrough } from "stream";
import * as dockerode from "dockerode";
import { access } from "fs-extra";
import { resolve } from "path";
import { DeepPartial } from "../utils";

import * as deepmerge from "deepmerge";

export interface IDockerExecuteOptions {
  Cmd: string[]; //'bash', '-c', 'echo test $VAR'],
  Env?: string[]; //['VAR=ttslkfjsdalkfj'],
  AttachStdout?: boolean; //true,
  AttachStderr?: boolean; //true
  Tty?: boolean; //true,
  stream?: boolean; // true,
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
  labels: { [key: string]: string };
  ports: { [internal: string]: number };
  binds: { [hostOrVolume: string]: string | (() => string) };
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

type IOptionsRequirements<T> = {
  [P in keyof T]: boolean | IOptionsRequirements<T[P]>
};

export const DockerRequirements = {
  cwd: true,
  image: {
    repository: true,
    tag: false
  },
  container: {
    binds: true,
    expose: true,
    command: true,
    hostname: true,
    labels: true,
    name: true,
    ports: true,
    removeVolumes: true
  },
  stdout: true,
  stderr: true,
  onStart: false,
  onStop: false,
  logs: true,
  errors: true
} as IOptionsRequirements<IDockerOptions>;

export default abstract class Docker {
  options: IDockerOptions;
  dockerode: dockerode;
  imageInfo?: dockerode.ImageInfo;
  containerInfo?: dockerode.ContainerInfo;

  container?: dockerode.Container;

  abstract defaultOptions(): DeepPartial<IDockerOptions>;

  optionsAssert<T>(
    options: DeepPartial<T>,
    requirements: IOptionsRequirements<T>,
    prefix: string = ""
  ) {
    if (typeof options === "undefined") {
      options = {};
    }

    for (let key in requirements) {
      if (typeof requirements[key] === "boolean") {
        if (requirements[key]) {
          console.assert(
            typeof options[key] !== "undefined",
            `Required option ${prefix}${key} isn't providen`
          );
        }
      } else {
        this.optionsAssert(
          <any>options[key],
          requirements[key],
          prefix + key + "."
        );
      }
    }
  }

  mergeOptions(...args: any[]): IDockerOptions {
    let result = {} as IDockerOptions;
    for (let opt of args) {
      if (typeof opt !== "undefined") {
        result = deepmerge(result, opt);
      }
    }
    return result;
  }

  constructor(options?: DeepPartial<IDockerOptions>) {
    this.options = this.mergeOptions(this.defaultOptions(), options);
    this.optionsAssert(this.options, DockerRequirements);
    this.dockerode = new dockerode();
  }

  static async create<T extends Docker>(
    ctor: new (options?: DeepPartial<IDockerOptions>) => T,
    options?: DeepPartial<IDockerOptions>
  ): Promise<T> {
    const instance = new ctor(options);
    return instance.initialize().then(docker => docker as T);
  }

  async initialize(): Promise<Docker> {
    if (!this.imageInfo) {
      this.imageInfo = await this.findImage();
    }

    if (!this.container) {
      this.container = await this.createContainer();
    }

    return this;
  }

  get ready() {
    return this.imageInfo && this.container;
  }

  get imageRepository() {
    return `${this.options.image.repository}:${this.options.image.tag}`;
  }

  get containerExposedPorts() {
    return this.options.container.expose.reduce(
      (expose, port) => {
        expose[port.toString()] = {};
        return expose;
      },
      {} as { [port: string]: {} }
    );
  }

  get containerPortBindings() {
    const keys = Object.keys(this.options.container.ports);
    return keys.reduce(
      (bindings, internal) => {
        bindings[internal] = [
          {
            HostIP: "127.0.0.1",
            HostPort: this.options.container.ports[internal].toString()
          }
        ];

        return bindings;
      },
      {} as { [portAndProtocol: string]: Array<{ [index: string]: string }> }
    );
  }

  get containerBinds() {
    const binds = Object.keys(this.options.container.binds);
    return binds.map(bind => {
      const host = this.options.container.binds[bind];
      if (typeof host === "function") {
        return `${host()}:${bind}`;
      } else {
        return `${host}:${bind}`;
      }
    });
  }

  get containerCommands() {
    const cmds = [];
    for (let command of this.options.container.command) {
      cmds.push(...command.split(" "));
    }

    return cmds;
  }

  private async findImage(): Promise<dockerode.ImageInfo> {
    const withTags = (image: dockerode.ImageInfo) =>
      image.RepoTags !== null && image.RepoTags.length;
    const compareString = (find: string) => (input: string) =>
      input.search(new RegExp(find)) >= 0;
    const withProperTag = (tag: string) => (image: dockerode.ImageInfo) =>
      image.RepoTags.find(compareString(tag));

    const available = await this.dockerode.listImages();
    const fit = available
      .filter(withTags)
      .filter(withProperTag(this.imageRepository));

    if (!fit.length) {
      throw new Error(
        `Image not found and unavailable at hub. Try docker pull ${
          this.imageRepository
        }`
      );
    } else {
      return fit[0];
    }
  }

  private async createContainer(): Promise<dockerode.Container> {
    if (!this.imageInfo) {
      throw new Error("Image required to create container");
    }

    return this.dockerode.createContainer({
      name: this.options.container.name,
      Image: this.imageInfo.RepoTags[0],
      Cmd: this.containerCommands,
      ExposedPorts: this.containerExposedPorts,
      Hostname: this.options.container.hostname,
      Labels: this.options.container.labels,
      HostConfig: {
        PortBindings: this.containerPortBindings,
        Binds: this.containerBinds
      }
    });
  }

  private transferStd(stream: NodeJS.ReadableStream) {
    const stdout = new PassThrough();
    const stderr = new PassThrough();
    this.container!.modem.demuxStream(stream, stderr, stdout);

    if (this.options.stdout) {
      this.transferStream(stdout, this.options.logs.bind(this));
    }
    if (this.options.stderr) {
      this.transferStream(stderr, this.options.errors.bind(this));
    }
  }

  private transferStream(
    stream: NodeJS.ReadableStream,
    destination: (line: string) => void
  ) {
    const passer = new PassThrough();
    passer.on("data", (chunk: any) => {
      destination(chunk.toString("utf8").slice(0, -1));
    });

    stream.on("data", (chunk: any) => {
      passer.write(chunk);
    });
  }

  async start(): Promise<any> {
    if (!this.ready) {
      await this.initialize();
    }

    if (!this.container) {
      throw new Error(
        "Container not found! Try initialize docker object before start"
      );
    }

    await this.container.start();

    this.container.logs(
      { follow: true, stdout: true, stderr: true },
      (err, stream: any) => {
        if (err) {
          throw err;
        }

        this.transferStd(stream);
      }
    );

    if (this.options.onStart && this.options.onStart.length) {
      for (let cmd of this.options.onStart) {
        await this.exec(...cmd.split(" "));
      }
    }
  }

  async stop() {
    if (!this.container) {
      throw new Error("container not found");
    }

    return this.container!.stop();
  }

  async remove() {
    if (!this.container) {
      throw new Error("container not found");
    }

    return this.container.remove({
      v: this.options.container.removeVolumes
    });
  }

  async exec(...args: string[]): Promise<void> {
    if (!this.container) {
      throw new Error(
        "Container not found! Try initialize docker object before start"
      );
    }

    const inspectResult = await this.container.inspect();

    if (!inspectResult.State.Running) {
      throw new Error("Container isn't running");
    }

    const execute: IDockerExecuteOptions = {
      Cmd: args,
      Tty: true,
      stream: true,
      AttachStdout: true,
      AttachStderr: true
    };

    return new Promise<void>((resolve, reject) => {
      this.container!.exec(execute, (err, exec) => {
        if (err) {
          return reject(err);
        }

        exec.start((err: any, stream: any) => {
          this.transferStd(stream);
          stream.on("end", () => {
            resolve();
          });
        });
      });
    });
  }

  async healthy(): Promise<boolean> {
    if (!this.container) {
      throw new Error(
        "Container not found! Try initialize docker object before start"
      );
    }

    const inspectResult = await this.container.inspect();
    return inspectResult.State.Running;
  }
}
