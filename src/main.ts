/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as Config from "./resources/config";
import * as utils from "./resources/utils";
import Command from "./Base/Command";
import Module from "./Base/Module";
import { Client, ClientOptions } from "oceanic.js";
import { Constants as CustomConstants, Permnodes } from "./resources/interfaces";
import { promises as fs } from "fs";
import { CustomData } from "./modules/main/internals/CustomDataHandler";
import monk, { IMonkManager } from "monk";
import * as emojis from "./resources/emojis";
import dotenv from "dotenv";
dotenv.config({
  path: "../.env"
});

interface ExtendedOptions extends ClientOptions {
  disabledModules?: ("Main" | "VC" | "Roles" | "Starboard" | "Moderation")[];
}

export default class Olive extends Client {

  readonly name: string;
  readonly perms: Permnodes[]
  readonly events: any[];
  readonly constants: CustomConstants;
  readonly disabledModules: string[];
  readonly db: IMonkManager;

  public modules: any[];
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

    Modules.forEach(Module => {
      const m: Module = new (require(`./modules/${Module.name}/main`)).default(this);
      this.modules.push(m);
    });

    this.modules.sort((a, b) => {
      return a.weight - b.weight;
    });

    for (const dm of this.disabledModules) {
      this.modules = this.modules.filter((m) => m.name !== dm); //filter and not load disabled modules
    }

    for (const m of this.modules) await m.run();
    
    //Load Events
    for (const e of this.events) {
      this.on(e.name, async (...args: any) => {
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