import { promises as fs } from "fs";
import { Client, ClientOptions } from "oceanic.js";
import monk, { IMonkManager } from "monk";
import dotenv from "dotenv";
import { Constants as CustomConstants, Permnodes } from "./resources/interfaces";
import { CustomData } from "./modules/main/internals/CustomDataHandler";
import * as Config from "./resources/config";
import * as utils from "./resources/utils";
import * as emojis from "./resources/emojis";
import Command from "./Base/Command";
import Module from "./Base/Module";
dotenv.config({
  path: "../.env"
});

interface ExtendedOptions extends ClientOptions {
  disabledModules?: ("Main" | "VC" | "Roles" | "Starboard" | "Moderation" | "User")[];
}

export default class Olive extends Client {

  readonly name: string;
  readonly perms: Permnodes[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly events: any[];
  readonly constants: CustomConstants;
  readonly disabledModules: string[];
  readonly db: IMonkManager;

  public modules: Module<"user" | "guild">[];
  public commands: Command[];

  public interactionCustomData: CustomData[];

  constructor(options?: ExtendedOptions) {
    super(options);

    this.name = Config.name;
    this.perms = [];
    this.events = [];
    this.modules = [];
    this.commands = [];
    this.interactionCustomData = [];
    this.constants = {
      emojis: emojis.default,
      config: Config,
      utils: utils
    };
    this.disabledModules = (options && options.disabledModules) ? [...options.disabledModules] : [];

    this.db = monk((process.env.DATABASE || "").replace("{db}", this.name).replace(" ", "_"));
  }

  readonly init = async (): Promise<void> => {
    
    //Load Modules Data (Commands, Events, Perms... etc)
    type AnyCtor = (new (b: typeof this) => Module<"user" | "guild">) & {
      context: "user" | "guild";
    };

    const dirs = await fs.readdir("./modules", { withFileTypes: true });
    for (const dir of dirs) {
      if (!dir.isDirectory()) continue;

      const mod = await import(`./modules/${dir.name}/main`);
      const Ctor = mod.default as AnyCtor;

      const m = new Ctor(this)

      this.modules.push(m);
    }

    this.modules.sort((a, b) => {
      return a.weight - b.weight;
    });

    for (const dm of this.disabledModules) {
      this.modules = this.modules.filter((m) => m.name !== dm); //filter and not load disabled modules
    }

    for (const m of this.modules) await m.init();
    
    //Load Events
    for (const e of this.events) {
      this.on(e.name, async (...args) => {
        for (const event of e.functions)
          await event.run(this, ...args);
      });
    }

    this.on("disconnect", () => this.connect());

    this.connect().catch(() => {
      const interval = setInterval(() => {
        this.connect()
          .then(() => {
            clearInterval(interval);
          })
          .catch(() => {
            console.log("[Discord] Failed to connect. Trying again in 5 minutes.");
          });
      }, 300000);
    });

  };

  // Lightweight initializer for API-only processes: loads DB and modules/services without connecting to Discord
  readonly initModulesOnly = async (): Promise<void> => {
    // Load modules just like init(), but skip event wiring and connect()
    type AnyCtor = (new (b: typeof this) => Module<"user" | "guild">) & {
      context: "user" | "guild";
    };

    const dirs = await fs.readdir("./modules", { withFileTypes: true });
    for (const dir of dirs) {
      if (!dir.isDirectory()) continue;

      const mod = await import(`./modules/${dir.name}/main`);
      const Ctor = mod.default as AnyCtor;

      const m = new Ctor(this);

      this.modules.push(m);
    }

    this.modules.sort((a, b) => a.weight - b.weight);

    for (const dm of this.disabledModules) {
      this.modules = this.modules.filter((m) => m.name !== dm);
    }

    for (const m of this.modules) await m.init();
  };

}