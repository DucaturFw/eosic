"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const dockerode = require("dockerode");
const path = require("path");
const slug = require("slug");
const inquirer = require("inquirer");
const signale = require("signale");
const chalk_1 = require("chalk");
exports.DEFAULT_IMAGE_REPO = "eosio/eos-dev";
exports.DEFAULT_IMAGE_TAG = "latest";
function choiceList(...args) {
    return args.map((message, index) => ({
        name: message,
        key: slug(message),
        value: index
    }));
}
var CreateImageAnswerEnum;
(function (CreateImageAnswerEnum) {
    CreateImageAnswerEnum[CreateImageAnswerEnum["Yes"] = 0] = "Yes";
    CreateImageAnswerEnum[CreateImageAnswerEnum["Prebuild"] = 1] = "Prebuild";
    CreateImageAnswerEnum[CreateImageAnswerEnum["Cancel"] = 2] = "Cancel";
})(CreateImageAnswerEnum = exports.CreateImageAnswerEnum || (exports.CreateImageAnswerEnum = {}));
class DockerEOS {
    constructor(cwd, imageCfg) {
        this._cwd = cwd || process.cwd();
        this.ready = false;
        this._config = {
            image: imageCfg || {
                repository: exports.DEFAULT_IMAGE_REPO,
                tag: exports.DEFAULT_IMAGE_TAG
            }
        };
        this._docker = new dockerode();
    }
    static async create(cwd, config) {
        let instance = new DockerEOS(cwd, config && config.imageConfig);
        await instance.initialize();
        return instance;
    }
    async initialize() {
        if (!this._imageInfo) {
            await this.findImage();
        }
        if (!this._containerInfo) {
            await this.findContainer();
        }
    }
    async findImage() {
        const availableImages = await this._docker.listImages();
        const fitImages = availableImages.filter(image => image.RepoTags &&
            image.RepoTags.find(tag => tag.search(new RegExp(`${this._config.image.repository}:${this._config.image.tag}`)) >= 0));
        // There isn't any fit images already available in docker
        if (!fitImages.length) {
            // Ask to compile
            await this.askAndCreateImage();
            await this.findImage();
        }
        else {
            this._imageInfo = fitImages[0]; // await this._docker.getImage(fitImages[0].Id)
        }
    }
    async askAndCreateImage() {
        const prompt = (await inquirer.prompt([
            {
                type: "list",
                name: "answer",
                message: "Should EOSIC build brand new docker image to operate?",
                choices: choiceList("Yes", "Select prebuilded image", "Cancel")
            }
        ]));
        switch (prompt.answer) {
            case CreateImageAnswerEnum.Yes:
                await this.createImage(await inquirer.prompt([
                    {
                        type: "input",
                        name: "dockerFile",
                        message: "Path to Dockerfile",
                        default: path.join(this._cwd, "Dockerfile"),
                        transformer: input => path.isAbsolute(input) ? input : path.resolve(this._cwd, input)
                    }
                ]));
                break;
            case CreateImageAnswerEnum.Prebuild:
                await this.selectImage();
                break;
            case CreateImageAnswerEnum.Cancel:
                throw new Error("Proccess was canceled");
        }
    }
    async createImage(opts) {
        const dockerFile = opts["dockerFile"];
        const stream = await this._docker.buildImage({
            context: path.dirname(dockerFile),
            src: [path.basename(dockerFile)]
        }, {
            t: `${this._config.image.repository}:${this._config.image.tag}`
        });
        const output = [];
        return new Promise((resolve, reject) => {
            const log = new stream_1.PassThrough();
            let header = null;
            log.on("data", (chunk) => {
                console.log(chalk_1.default.white(chunk.toString("utf8").trim()));
            });
            stream.on("data", (chunk) => {
                try {
                    log.write(JSON.parse(chunk.toString("utf8")).stream);
                }
                catch (_a) { }
            });
            stream.on("readable", function () {
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
                    }
                    else {
                        log.write(payload);
                    }
                    header = stream.read(8);
                }
            });
            stream.on("end", () => resolve());
            stream.on("error", reject);
        });
    }
    async selectImage() {
        throw new Error("Method not implemented.");
    }
    async findContainer() {
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
                    `${this._cwd}/config.ini:/opt/eosio/bin/data-dir/config.ini`,
                    `${this._cwd}/contracts:/contracts`,
                    `${path.resolve(__dirname, "..", "..", "bin")}/.bashrc:/.bashrc`,
                    `${path.resolve(__dirname, "..", "..", "bin")}/eosiocppfix:/eosiocppfix`,
                    `${path.resolve(__dirname, "..", "..", "bin")}/compile:/compile`
                ]
            }
        });
        console.log([
            `${this._cwd}/config.ini:/opt/eosio/bin/data-dir/config.ini`,
            `${this._cwd}/contracts:/contracts`,
            `${path.resolve(__dirname, "..", "..", "bin")}/.bashrc:/.bashrc`,
            `${path.resolve(__dirname, "..", "..", "bin")}/eosiocppfix:/eosiocppfix`,
            `${path.resolve(__dirname, "..", "..", "bin")}/compile:/compile`
        ]);
    }
    async start(log) {
        if (!this._container) {
            throw new Error("Container not found!");
        }
        await this._container.start();
        if (log) {
            const logStream = new stream_1.PassThrough();
            logStream.on("data", function (chunk) {
                console.log(chalk_1.default.white(chunk.toString("utf8").slice(0, -1)));
            });
            this._container.logs({
                follow: true,
                stdout: true,
                stderr: true
            }, (err, stream) => {
                if (err || !this._container) {
                    return console.error(err.message);
                }
                this._container.modem.demuxStream(stream, logStream, logStream);
                stream.on("end", function () {
                    logStream.end("!stop!");
                });
            });
        }
        await this.exec("bash", "-c", "chmod +x /compile");
        await this.exec("bash", "-c", "chmod +x /eosiocppfix");
        signale.debug("Container started");
    }
    stop() {
        if (!this._container) {
            throw new Error("container not found");
        }
        signale.debug("Container stopped");
        return this._container.stop();
    }
    remove() {
        if (!this._container) {
            throw new Error("container not found");
        }
        signale.debug("Container destroyed");
        return this._container.remove({
            v: true
        });
    }
    async exec(...args) {
        const execute = {
            Cmd: args,
            Tty: true,
            stream: true,
            AttachStdout: true,
            AttachStderr: true
        };
        if (this._container && (await this._container.inspect()).State.Running) {
            // if (this._container) {
            return new Promise((resolve, reject) => {
                let output = "";
                this._container &&
                    this._container.exec(execute, (err, exec) => {
                        if (err) {
                            return reject(err);
                        }
                        exec.start((err, stream) => {
                            stream.on("data", (chunk) => (output += chunk.toString("utf8")));
                            stream.on("end", () => resolve(output));
                        });
                    });
            });
        }
        throw new Error("container not found");
    }
    compile(name) {
        return this.exec("bash", "-c", `/compile ${name}`);
    }
}
exports.DockerEOS = DockerEOS;
