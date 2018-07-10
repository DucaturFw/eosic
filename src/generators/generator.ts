import * as path from "path";
import * as globby from "globby";
import * as fs from "fs-extra";
import * as hb from "handlebars";

export interface GeneratorOptions {
  quiet: boolean;
  force: boolean;
  cwd: string;
}

export interface GeneratorInterface {
  generate(opts?: GeneratorOptions): Promise<void>;
}

export default abstract class Generator<T extends object>
  implements GeneratorInterface {
  options!: GeneratorOptions & T;
  abstract readonly defaultConfig: T;
  readonly templateRoot: string = path.resolve(__dirname, "../templates");

  async generate(opts: GeneratorOptions & T) {
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
  async configure() {}
  async validate() {}

  abstract async install(): Promise<void>;
  abstract async prompt(): Promise<T>;

  async clone(template: string, ...destination: string[]): Promise<void> {
    const destinationPath = path.resolve(
      path.resolve(this.options.cwd, ...destination)
    );
    const templatePath = path.resolve(path.join(this.templateRoot, template));
    await fs.copy(templatePath, destinationPath, {
      recursive: true
    });
  }

  async prepare(...relative: string[]): Promise<void> {
    const templates = await globby("**/*.ejs", {
      absolute: true,
      cwd: relative.length
        ? path.resolve(this.options.cwd, ...relative)
        : this.options.cwd
    });

    await Promise.all(templates.map(file => this.prepareFile(file)));
  }

  async prepareFile(file: string): Promise<void> {
    const fileContent = await fs.readFile(file, "utf8");
    const preparedFile = hb.compile(fileContent)(this.options);
    await fs.writeFile(file, preparedFile);
    await fs.rename(file, hb.compile(file.replace(".ejs", ""))(this.options));
  }
}
