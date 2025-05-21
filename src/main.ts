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
  disabledModules?: ("Main" | "VC" | "Roles" | "Starboard" | "Moderation")[];
}

export default class Olive extends Client {

  readonly name: string;
  readonly perms: Permnodes[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly events: any[];
  readonly constants: CustomConstants;
  readonly disabledModules: string[];
  readonly db: IMonkManager;

  public modules: Module[];
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
      emojis: emojis,
      config: Config,
      utils: utils
    };
    this.disabledModules = (options && options.disabledModules) ? [...options.disabledModules] : [];

    this.db = monk((process.env.DATABASE || "").replace("{db}", this.name).replace(" ", "_"));
  }

  readonly init = async (): Promise<void> => {
    
    //Load Modules Data (Commands, Events, Perms... etc)
    const Modules = await fs.readdir("./modules", { withFileTypes: true });

    Modules.forEach(async Module => {
      const m = new (await import(`./modules/${Module.name}/main`)).default(this) as Module;
      this.modules.push(m);
    });

    this.modules.sort((a, b) => {
      return a.weight - b.weight;
    });

    for (const dm of this.disabledModules) {
      this.modules = this.modules.filter((m) => m.name !== dm); //filter and not load disabled modules
    }

    for (const m of this.modules) await m.load();
    
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

}