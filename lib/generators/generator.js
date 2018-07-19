"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const globby = require("globby");
const fs = require("fs-extra");
const hb = require("handlebars");
class Generator {
    constructor() {
        this.templateRoot = path.resolve(__dirname, "../../templates");
        this.options = {};
    }
    async generate(opts) {
        this.options = opts;
        this.options = Object.assign(this.defaultConfig, opts);
        await this.configure();
        if (!this.options.quiet) {
            this.options = Object.assign(this.options, await this.prompt());
        }
        await this.validate();
        await this.install();
    }
    // placeholders to override in inherit classes
    async configure() { }
    async validate() { }
    async clone(template, ...destination) {
        const destinationPath = path.resolve(path.resolve(this.options.cwd, ...destination));
        const templatePath = path.resolve(path.join(this.templateRoot, template));
        await fs.copy(templatePath, destinationPath, {
            recursive: true
        });
    }
    async prepare(...relative) {
        const templates = await globby("**/*.ejs", {
            absolute: true,
            cwd: relative.length
                ? path.resolve(this.options.cwd, ...relative)
                : this.options.cwd
        });
        await Promise.all(templates.map(file => this.prepareFile(file)));
    }
    async prepareFile(file) {
        const fileContent = await fs.readFile(file, "utf8");
        const preparedFile = hb.compile(fileContent)(this.options);
        await fs.writeFile(file, preparedFile);
        await fs.rename(file, hb.compile(file.replace(".ejs", ""))(this.options));
    }
}
exports.default = Generator;
