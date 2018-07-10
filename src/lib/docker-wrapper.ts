import { PassThrough } from "stream";
import * as dockerode from "dockerode";
import * as execa from "execa";
import * as path from "path";
import * as fs from "fs-extra";
import * as slug from "slug";
import * as inquirer from "inquirer";
import * as signale from "signale";
import chalk from "chalk";

export const DEFAULT_IMAGE_REPO = "eosic/environment";
export const DEFAULT_IMAGE_TAG = "latest";

function choiceList(...args: string[]): inquirer.objects.ChoiceOption[] {
  return args.map((message, index) => ({
    name: message,
    key: slug(message),
    value: index
  }));
}

export interface DockerExecuteOptions {
  Cmd: string[]; //'bash', '-c', 'echo test $VAR'],
  Env?: string[]; //['VAR=ttslkfjsdalkfj'],
  AttachStdout?: boolean; //true,
  AttachStderr?: boolean; //true
  Tty?: boolean; //true,
  stream?: boolean; // true,
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

export enum CreateImageAnswerEnum {
  Yes,
  Prebuild,
  Cancel
}

export interface CreateImageAnswer {
  answer: number;
}

export class DockerEOS {
  _config: DockerEOSConfig;
  _docker: dockerode;
  _imageInfo?: dockerode.ImageInfo;
  _containerInfo?: dockerode.ContainerInfo;
  _image?: dockerode.Image;
  _container?: dockerode.Container;

  ready: boolean;

  constructor(imageCfg?: DockerEOSImageConfig) {
    this.ready = false;
    this._config = {
      image: imageCfg || {
        repository: DEFAULT_IMAGE_REPO,
        tag: DEFAULT_IMAGE_TAG
      }
    };

    this._docker = new dockerode();
  }

  static async create(config?: DockerEOSCreateConfig): Promise<DockerEOS> {
    let instance = new DockerEOS(config && config.imageConfig);
    await instance.initialize();
    return instance;
  }

  async initialize(): Promise<void> {
    if (!this._imageInfo) {
      await this.findImage();
    }

    if (!this._containerInfo) {
      await this.findContainer();
    }
  }

  async findImage(): Promise<void> {
    const availableImages = await this._docker.listImages();
    const fitImages = availableImages.filter(
      image =>
        image.RepoTags &&
        image.RepoTags.find(
          tag =>
            tag.search(
              new RegExp(
                `${this._config.image.repository}:${this._config.image.tag}`
              )
            ) >= 0
        )
    );

    // There isn't any fit images already available in docker
    if (!fitImages.length) {
      // Ask to compile
      await this.askAndCreateImage();
      await this.findImage();
    } else {
      this._imageInfo = fitImages[0]; // await this._docker.getImage(fitImages[0].Id)
    }
  }

  async askAndCreateImage(): Promise<void> {
    const prompt = (await inquirer.prompt([
      {
        type: "list",
        name: "answer",
        message: "Should EOSIC build brand new docker image to operate?",
        choices: choiceList("Yes", "Select prebuilded image", "Cancel")
      }
    ])) as CreateImageAnswer;

    switch (prompt.answer) {
      case CreateImageAnswerEnum.Yes:
        await this.createImage(
          await inquirer.prompt([
            {
              type: "input",
              name: "dockerFile",
              message: "Path to Dockerfile",
              default: path.join(process.cwd(), "Dockerfile"),
              transformer: input =>
                path.isAbsolute(input)
                  ? input
                  : path.resolve(process.cwd(), input)
            }
          ])
        );
        break;
      case CreateImageAnswerEnum.Prebuild:
        await this.selectImage();
        break;
      case CreateImageAnswerEnum.Cancel:
        throw new Error("Proccess was canceled");
    }
  }

  async createImage(opts: { [name: string]: any }): Promise<void> {
    const dockerFile = opts["dockerFile"] as string;
    const stream = await this._docker.buildImage(
      {
        context: path.dirname(dockerFile),
        src: [path.basename(dockerFile)]
      },
      {
        t: `${this._config.image.repository}:${this._config.image.tag}`
      }
    );

    const output: string[] = [];

    return new Promise<void>((resolve, reject) => {
      const log = new PassThrough();
      let header: any = null;
      log.on("data", (chunk: any) => {
        console.log(chalk.white(chunk.toString("utf8").trim()));
      });

      stream.on("data", (chunk: any) => {
        try {
          log.write(JSON.parse(chunk.toString("utf8")).stream);
        } catch {}
      });

      stream.on("readable", function() {
        header = header || stream.read(8);

        while (header !== null) {
          var type = header.readUInt8(0);
          var payload = stream.read(header.readUInt32BE(4));
          if (payload === null) {
            break;
          }
          console.log(type);
          console.log(payload);
          if (type == 2) {
            log.write(payload);
          } else {
            log.write(payload);
          }
          header = stream.read(8);
        }
      });

      stream.on("end", () => resolve());
      stream.on("error", reject);
    });
  }

  async selectImage(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async findContainer(): Promise<void> {
    if (!this._imageInfo) {
      throw new Error("Image required to create container");
    }

    this._container = await this._docker.createContainer({
      name: `eosic-${(Math.random() * 0xffffff) >> 0}`,
      Image: this._imageInfo.RepoTags[0],
      // Cmd: ["/bin/bash"],
      Cmd: [
        "/opt/eosio/bin/nodeosd.sh",
        "--data-dir",
        "/opt/eosio/bin/data-dir",
        "-e",
        "--contracts-console"
      ],
      ExposedPorts: {
        "8888": {},
        "9876": {}
      },
      Hostname: "eosic",
      Labels: {
        eosic: "true",
        "eosic.version": "0.0.1"
      },
      HostConfig: {
        PortBindings: {
          "8888": [
            {
              HostPort: "8888"
            }
          ],
          "9876": [
            {
              HostPort: "9876"
            }
          ]
        },
        Binds: [
          `${process.cwd()}/config.ini:/opt/eosio/bin/data-dir/config.ini`,
          `${process.cwd()}/contracts:/contracts`,
          `${path.resolve(__dirname, "..", "bin")}/.bashrc:/.bashrc`,
          `${path.resolve(__dirname, "..", "bin")}/eosiocppfix:/eosiocppfix`,
          `${path.resolve(__dirname, "..", "bin")}/compile:/compile`
        ]
      }
    });
  }

  async start(log: boolean): Promise<any> {
    if (!this._container) {
      throw new Error("Container not found!");
    }

    await this._container.start();

    if (log) {
      const logStream = new PassThrough();
      logStream.on("data", function(chunk: any) {
        console.log(chalk.white(chunk.toString("utf8").slice(0, -1)));
      });

      this._container.logs(
        {
          follow: true,
          stdout: true,
          stderr: true
        },
        (err, stream: any) => {
          if (err || !this._container) {
            return console.error(err.message);
          }

          this._container.modem.demuxStream(stream, logStream, logStream);
          stream.on("end", function() {
            logStream.end("!stop!");
          });
        }
      );
    }

    await this.exec("bash", "-c", "chmod +x /compile");
    await this.exec("bash", "-c", "chmod +x /eosiocppfix");
    signale.debug("Container started");
  }

  stop(): Promise<any> {
    if (!this._container) {
      throw new Error("container not found");
    }

    signale.debug("Container stopped");
    return this._container.stop();
  }

  remove(): Promise<any> {
    if (!this._container) {
      throw new Error("container not found");
    }

    signale.debug("Container destroyed");
    return this._container.remove({
      v: true
    });
  }

  async exec(...args: string[]): Promise<string> {
    const execute: DockerExecuteOptions = {
      Cmd: args,
      Tty: true,
      stream: true,
      AttachStdout: true,
      AttachStderr: true
    };
    if (this._container && (await this._container.inspect()).State.Running) {
      // if (this._container) {
      return new Promise<string>((resolve, reject) => {
        let output: string = "";
        this._container &&
          this._container.exec(execute, (err, exec) => {
            if (err) {
              return reject(err);
            }
            exec.start((err: any, stream: any) => {
              stream.on(
                "data",
                (chunk: any) => (output += chunk.toString("utf8"))
              );
              stream.on("end", () => resolve(output));
            });
          });
      });
    }

    throw new Error("container not found");
  }

  compile(name: string): Promise<string> {
    return this.exec("bash", "-c", `/compile ${name}`);
  }
}
