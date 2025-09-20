/* eslint-disable @typescript-eslint/no-var-requires */

import { promises as fs } from "fs";
import { Permnodes, Constants } from "../resources/interfaces";
import { ModuleDataMap, ModuleName } from "../Database/ModuleTypes";
import ExtendedClient from "./Client";
import Command from "./Command";
import Service from "./Service";
import { UserModuleData } from "../Database/interfaces/UserModuleData";

export interface moduleDataStructure {
  version: string;
  guildID: string;
}

export default abstract class Module {
  public abstract name: ModuleName;
  public service?: Service;
  public serviceEnabled?: boolean;

  readonly version: string;
  readonly bot: ExtendedClient;
  readonly constants: Constants;
  readonly path: string;
  readonly weight: number;
  readonly db?: boolean;
  readonly moduleData: unknown;

  constructor(bot: ExtendedClient) {
    this.version = "0.0";
    this.bot = bot;
    this.constants = bot.constants;
    this.path = "";
    this.weight = 2; //Loads AFTER Main module | Should go as follows: Main Module => Dependencies => Modules => Sub Modules
    this.db = false;
  }

  public async data<
    K extends keyof ModuleDataMap<T>,
    T extends "user" | "guild" = "guild"
  >(ctx: { userID?: string; guildID?: string }): Promise<unknown> {
    if (!this.db)
      throw new Error(`Module ${this.name} does not support a database.`);

    let data: unknown;
    if ("guildID" in ctx && ctx.guildID !== undefined) {
      const guild = this.bot.findGuild(ctx.guildID);
      if (!guild) return;

      data = await this.bot.db.get(this.name).findOne({ guildID: guild.id });
      if (!data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.moduleData as any).guildID = guild.id;

        this.bot.constants.utils.log(
          this.name,
          `Module data not found for guild "${guild.name}" (${guild.id}). Creating now...`
        );
        await this.bot.db.get(this.name).bulkWrite([
          {
            updateOne: {
              filter: { guildID: guild.id },
              update: { $set: this.moduleData },
              upsert: true,
            },
          },
        ]);
        this.bot.constants.utils.log(
          this.name,
          `Module data created for guild "${guild.name}".`
        );
      } else if ("userID" in ctx && ctx.userID !== undefined) {
        if (!this.db || !ctx.userID) return;

        const user = this.bot.findUser(ctx.userID);
        if (!user) return;

        data = (await this.bot.db
          .get(this.name)
          .findOne({ userID: user.id })) as UserModuleData | undefined;
        if (!data) {
          (this.moduleData as UserModuleData).userID = user.id;

          this.bot.constants.utils.log(
            this.name,
            `Module data not found for user "${user.username}" (${user.id}). Creating now...`
          );
          await this.bot.db.get(this.name).bulkWrite([
            {
              updateOne: {
                filter: { userID: user.id },
                update: { $set: this.moduleData },
                upsert: true,
              },
            },
          ]);
          this.bot.constants.utils.log(
            this.name,
            `Module data created for user "${user.username}" (${user.id}).`
          );
        }
    
        data = (await this.bot.db.get(this.name).findOne({ userID: user.id }))
      }

      data = await this.bot.db.get(this.name).findOne({ guildID: guild.id });
    }

    return data;
  }

  public async init(): Promise<void> {
    this.constants.utils.log(this.name, "Loading...");

    //Load Commands
    const Categories = await fs.readdir(`./${this.path}/commands`, {
      withFileTypes: true,
    });

    for (const Cat of Categories) {
      if (!Cat.isDirectory()) return;

      const Category: string = Cat.name,
        Commands = await fs.readdir(`./${this.path}/commands/${Category}`);

      Commands.forEach((Command) => {
        const cObj: Command =
          new (require(`../${this.path}/commands/${Category}/${Command}`).default)(
            this.bot
          );
        cObj.category = Category;

        this.bot.commands.push(cObj);
      });
    }

    //Load Perms
    const permissions = await require(`../${this.path}/permnodes`).default;
    permissions.forEach((permission: Permnodes) => {
      this.bot.perms.push(permission);
    });

    //Load Events
    const Events = await fs.readdir(`./${this.path}/events`, {
      withFileTypes: true,
    });
    for (const e of Events) {
      const event: string = e.name.replace(/\..*/g, "");

      this.bot.events.find((e) => e.name === event)
        ? this.bot.events
            .find((e) => e.name === event)
            .functions.push(require(`../${this.path}/events/${e.name}`))
        : this.bot.events.push({
            name: event,
            functions: [require(`../${this.path}/events/${e.name}`)],
          });
    }

    this.constants.utils.log(this.name, "Loaded.");

    // Load Service
    // use fs to check if service.ts exists
    if (this.serviceEnabled == true) {
      try {
        const servicePath = `../${this.path}/service`;
        this.service = new (require(servicePath).default)(this.bot);
        this.constants.utils.log(this.name, "Service loaded successfully.");
      } catch (error) {
        console.error(`Failed to load service for module ${this.name}:`, error);
      }
    }
  }
}
