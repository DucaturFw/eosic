"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const dockerode = require("dockerode");
const deepmerge = require("deepmerge");
exports.DockerRequirements = {
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
};
class Docker {
    optionsAssert(options, requirements, prefix = "") {
        if (typeof options === "undefined") {
            options = {};
        }
        for (let key in requirements) {
            if (typeof requirements[key] === "boolean") {
                if (requirements[key]) {
                    console.assert(typeof options[key] !== "undefined", `Required option ${prefix}${key} isn't providen`);
                }
            }
            else {
                this.optionsAssert(options[key], requirements[key], prefix + key + ".");
            }
        }
    }
    mergeOptions(...args) {
        let result = {};
        for (let opt of args) {
            if (typeof opt !== "undefined") {
                result = deepmerge(result, opt);
            }
        }
        return result;
    }
    constructor(options) {
        this.options = this.mergeOptions(this.defaultOptions(), options);
        this.optionsAssert(this.options, exports.DockerRequirements);
        this.dockerode = new dockerode();
    }
    static async create(ctor, options) {
        const instance = new ctor(options);
        return instance.initialize().then(docker => docker);
    }
    async initialize() {
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
        return this.options.container.expose.reduce((expose, port) => {
            expose[port.toString()] = {};
            return expose;
        }, {});
    }
    get containerPortBindings() {
        const keys = Object.keys(this.options.container.ports);
        return keys.reduce((bindings, internal) => {
            bindings[internal] = [
                { HostPort: this.options.container.ports[internal].toString() }
            ];
            return bindings;
        }, {});
    }
    get containerBinds() {
        const binds = Object.keys(this.options.container.binds);
        return binds.map(bind => {
            const host = this.options.container.binds[bind];
            if (typeof host === "function") {
                return `${host()}:${bind}`;
            }
            else {
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
    async findImage(pull = true) {
        const withTags = (image) => image.RepoTags !== null && image.RepoTags.length;
        const compareString = (find) => (input) => input.search(new RegExp(find)) >= 0;
        const withProperTag = (tag) => (image) => image.RepoTags.find(compareString(tag));
        const available = await this.dockerode.listImages();
        const fit = available
            .filter(withTags)
            .filter(withProperTag(this.imageRepository));
        if (!fit.length) {
            if (pull) {
                const image = await this.dockerode.pull(this.imageRepository, {});
                return this.findImage(false);
            }
            else {
                throw new Error("Image not found and unavailable at hub");
            }
        }
        else {
            return fit[0];
        }
    }
    async createContainer() {
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
    transferStd(stream) {
        const stdout = new stream_1.PassThrough();
        const stderr = new stream_1.PassThrough();
        this.container.modem.demuxStream(stream, stderr, stdout);
        if (this.options.stdout) {
            this.transferStream(stdout, this.options.logs.bind(this));
        }
        if (this.options.stderr) {
            this.transferStream(stderr, this.options.errors.bind(this));
        }
    }
    transferStream(stream, destination, parser = (chunk) => chunk) {
        const passer = new stream_1.PassThrough();
        passer.on("data", (chunk) => {
            destination(chunk.toString("utf8").slice(0, -1));
        });
        stream.on("data", (chunk) => {
            passer.write(chunk);
        });
    }
    async start() {
        if (!this.ready) {
            await this.initialize();
        }
        if (!this.container) {
            throw new Error("Container not found! Try initialize docker object before start");
        }
        await this.container.start();
        this.container.logs({ follow: true, stdout: true, stderr: true }, (err, stream) => {
            if (err) {
                throw err;
            }
            this.transferStd(stream);
        });
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
        return this.container.stop();
    }
    async remove() {
        if (!this.container) {
            throw new Error("container not found");
        }
        return this.container.remove({
            v: this.options.container.removeVolumes
        });
    }
    async exec(...args) {
        if (!this.container) {
            throw new Error("Container not found! Try initialize docker object before start");
        }
        const inspectResult = await this.container.inspect();
        if (!inspectResult.State.Running) {
            throw new Error("Container isn't running");
        }
        const execute = {
            Cmd: args,
            Tty: true,
            stream: true,
            AttachStdout: true,
            AttachStderr: true
        };
        return new Promise((resolve, reject) => {
            this.container.exec(execute, (err, exec) => {
                if (err) {
                    return reject(err);
                }
                exec.start((err, stream) => {
                    this.transferStd(stream);
                    stream.on("end", () => resolve());
                });
            });
        });
    }
    async healthy() {
        if (!this.container) {
            throw new Error("Container not found! Try initialize docker object before start");
        }
        const inspectResult = await this.container.inspect();
        return inspectResult.State.Running;
    }
}
exports.default = Docker;
