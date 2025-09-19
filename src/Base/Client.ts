import {
  Constants,
  CreateApplicationCommandOptions,
  CreateChatInputApplicationCommandOptions,
  CreateGuildApplicationCommandOptions,
  Guild,
  GuildChannel,
  Member,
  Message,
  Role,
  TextChannel,
  User,
} from "oceanic.js";
import { Entity } from "../resources/interfaces";
import Olive from "../main";
import { ModuleDataMap, ModuleMap, ModuleName } from "../Database/ModuleTypes";
import Command from "./Command";
import Module from "./Module";

export default class ExtendedClient extends Olive {
  readonly findUser = (query: string | undefined): User | undefined => {
    if (!query) return;

    if (/^\d+$/.test(query)) return this.users.get(query);
    else if (/^<@!?\d+>$/.test(query))
      return this.users.get((query.match(/\d+/) as RegExpMatchArray)[0]);
    else if (/^\w+#\d{4}$/.test(query))
      return this.users.find(
        (u: User) =>
          u.username.toLowerCase() ===
            (query.toLowerCase().match(/^\w+/) as RegExpMatchArray)[0] &&
          u.discriminator ===
            (query.match(/\d+/) as RegExpMatchArray)[0].toString()
      );
    else if (
      this.users.find(
        (u: User) => u.username.toLowerCase() === query.toLowerCase()
      )
    )
      return this.users.find(
        (u: User) => u.username.toLowerCase() === query.toLowerCase()
      );
  };

  readonly findGuild = (
    query: string | undefined | null
  ): Guild | undefined => {
    if (!query) return;

    if (/^\d+$/.test(query)) return this.guilds.get(query);
    else if (
      this.guilds.find(
        (g: Guild) => g.name.toLowerCase() === query.toLowerCase()
      )
    )
      return this.guilds.find(
        (g: Guild) => g.name.toLowerCase() === query.toLowerCase()
      );
  };

  readonly findMember = (
    guild: Guild,
    query: string | undefined
  ): Member | undefined => {
    if (!query || !guild) return;

    if (/^\d+$/.test(query)) return guild.members.get(query);
    else if (/^<@!?\d+>$/.test(query))
      return guild.members.get((query.match(/\d+/) as RegExpMatchArray)[0]);
    else if (/^\w+#\d{4}$/.test(query))
      return guild.members.find(
        (m: Member) =>
          m.username.toLowerCase() ===
            (query.toLowerCase().match(/^\w+/) as RegExpMatchArray)[0] &&
          m.discriminator ===
            (query.match(/\d+/) as RegExpMatchArray)[0].toString()
      );
    else if (
      guild.members.find(
        (m: Member) => m.username.toLowerCase() === query.toLowerCase()
      )
    )
      return guild.members.find(
        (m: Member) => m.username.toLowerCase() === query.toLowerCase()
      );
  };

  readonly findChannel = (
    guild: Guild,
    query: string | undefined
  ): GuildChannel | undefined => {
    if (!query || !guild) return;

    if (/^\d+$/.test(query)) return guild.channels.get(query);
    else if (/^<#\d+>$/.test(query))
      return guild.channels.get((query.match(/\d+/) as RegExpMatchArray)[0]);
    else if (
      guild.channels.find(
        (c: GuildChannel) => c.name.toLowerCase() === query.toLowerCase()
      )
    )
      return guild.channels.find(
        (c: GuildChannel) => c.name.toLowerCase() === query.toLowerCase()
      );
  };

  readonly findRole = (
    guild: Guild,
    query: string | undefined
  ): Role | undefined => {
    if (!query || !guild) return;

    if (/^\d+$/.test(query)) return guild.roles.get(query);
    else if (/^<#\d+>$/.test(query))
      return guild.roles.get((query.match(/\d+/) as RegExpMatchArray)[0]);
    else if (
      guild.roles.find(
        (r: Role) => r.name.toLowerCase() === query.toLowerCase()
      )
    )
      return guild.roles.find(
        (r: Role) => r.name.toLowerCase() === query.toLowerCase()
      );
  };

  readonly findMessage = (
    channel: TextChannel,
    query: string | undefined
  ): Message | undefined => {
    if (!query || !channel) return;

    if (/^\d+$/.test(query)) return channel.messages.get(query);
    else if (
      channel.messages.find(
        (m: Message) => m.content.toLowerCase() === query.toLowerCase()
      )
    )
      return channel.messages.find(
        (m: Message) => m.content.toLowerCase() === query.toLowerCase()
      );
  };

  readonly findEntity = (
    guild: Guild,
    query: string | undefined
  ): Entity | undefined => {
    if (!query || !guild) return;

    const obj: Entity = {
      type: "undefined",
    };

    if (guild.roles.get(query)) {
      obj.role = guild.roles.get(query);
      obj.type = "role";
    }
    if (guild.members.get(query)) {
      obj.member = guild.members.get(query);
      obj.type = "member";
    }

    return obj.type === "undefined" ? undefined : obj;
  };

  public async getUserData(
    userID: string
  ): Promise<ModuleDataMap<"user">["User"] | undefined> {
    const userModule = this.getModule("User");
    return await userModule.data(userID) as ModuleDataMap<"user">["User"] | undefined;
  };

  public getModule<K extends keyof ModuleMap>(name: K): ModuleMap[K] {
    const Module = this.modules.find((m) => m.name === name);

    if (!Module) throw new Error(`Module ${name} not found!`);

    return Module as ModuleMap[K];
  }

  public async getModuleData<
    K extends keyof ModuleDataMap<T>,
    T extends "user" | "guild" = "guild"
  >(
    name: K,
    ctx: { userID?: string; guildID?: string }
  ): Promise<ModuleDataMap<T>[K] | undefined> {
    if (!ctx) return undefined;

    if ("guildID" in ctx && ctx.guildID !== undefined) {
      const Module = this.getModule(name as keyof ModuleMap) as Module;

      return await Module.data(ctx.guildID) as Promise<ModuleDataMap<T>[K]>;
    } else if ("userID" in ctx && ctx.userID !== undefined) {
      return await this.getUserData(ctx.userID) as ModuleDataMap<T>[K];
    }
  }

  public async getAllData<T extends keyof ModuleDataMap>(
    name: T
  ): Promise<ModuleDataMap[T][]> {
    const Module = this.getModule(name) as Module;

    if (!Module) return [];
    const data = await this.db.get(Module.name).find({});

    return data;
  }

  // Overload: guild by ctx
  public async updateModuleData<K extends keyof ModuleDataMap<"guild">>(
    name: K,
    data: ModuleDataMap<"guild">[K],
    ctx: { guildID: string }
  ): Promise<ModuleDataMap<"guild">[K]>;
  // Overload: guild by id or Guild (back-compat)
  public async updateModuleData<K extends keyof ModuleDataMap<"guild">>(
    name: K,
    data: ModuleDataMap<"guild">[K],
    guild: string | Guild
  ): Promise<ModuleDataMap<"guild">[K]>;
  // Overload: user ctx
  public async updateModuleData(
    name: "User",
    data: ModuleDataMap<"user">["User"],
    ctx: { userID: string }
  ): Promise<ModuleDataMap<"user">["User"]>;
  // Implementation
  public async updateModuleData(
    name: keyof ModuleDataMap<"guild"> | "User",
    data: ModuleDataMap["Main" | "Logging" | "VC" | "Moderation" | "Roles" | "Starboard"] | ModuleDataMap<"user">["User"],
    ctxOrGuild: { userID?: string; guildID?: string } | string | Guild
  ): Promise<unknown> {
    if (!data) throw new Error("No data provided!");

    // User context path
    if (
      typeof ctxOrGuild === "object" &&
      ctxOrGuild !== null &&
      "userID" in ctxOrGuild &&
      ctxOrGuild.userID &&
      name === "User"
    ) {
      const userID = ctxOrGuild.userID as string;
      const userModule = this.getModule("User");
      return (await userModule.update(userID, data as ModuleDataMap<"user">["User"])) as ModuleDataMap<"user">["User"];
    }

    // Guild context path (supports ctx object, id string, or Guild)
    let guild: Guild | undefined;
    let guildID: string | undefined;

    if (
      typeof ctxOrGuild === "object" &&
      ctxOrGuild !== null &&
      "guildID" in ctxOrGuild &&
      ctxOrGuild.guildID
    ) {
      guildID = (ctxOrGuild as { guildID: string }).guildID;
    } else if (typeof ctxOrGuild === "string") {
      guildID = ctxOrGuild;
    } else {
      guild = ctxOrGuild as Guild;
      guildID = guild?.id;
    }

    if (!guild && guildID) guild = this.findGuild(guildID) as Guild;
    if (!guild) throw new Error("Could not find guild!");

    const Module = this.getModule(name as keyof ModuleMap) as Module;
    const collection = this.db.get(Module.name);
    const existingGuildData = await collection.findOne({ guildID: guild.id });

    // Ensure identity + version
    (data as { guildID: string; version: string }).guildID = guild.id;
    (data as { guildID: string; version: string }).version = Module.version;

    if (!existingGuildData) {
      await collection.insert(data);
    } else {
      await collection.findOneAndUpdate({ guildID: guild.id }, { $set: data });
    }

    return data as ModuleDataMap["Main" | "Logging" | "VC" | "Moderation" | "Roles" | "Starboard"];
  }

  readonly reload = async (): Promise<void> => {
    const GlobalApplicationCommands: CreateApplicationCommandOptions[] = [],
      GuildSpecificCommands: {
        id: string;
        commands: CreateGuildApplicationCommandOptions[];
      }[] = [];

    this.commands
      .filter((c) => !c.disabled)
      .forEach(async (c: Command) => {
        switch (c.type) {
          case Constants.ApplicationCommandTypes.USER:
          case Constants.ApplicationCommandTypes.MESSAGE: {
            const command: CreateApplicationCommandOptions = {
              name: c.commands[0],
              type: c.type,
            };

            GlobalApplicationCommands.push(command);
            break;
          }
          case Constants.ApplicationCommandTypes.CHAT_INPUT: {
            const command: CreateChatInputApplicationCommandOptions = {
              name: c.commands[0],
              description: c.description || "No description provided.",
              type: c.type,
            };

            if (c.options) command.options = c.options;

            if (c.guildSpecific && c.guildSpecific.length)
              for (const guild of c.guildSpecific) {
                const guildCommand = GuildSpecificCommands.find(
                  (gc) => gc.id === guild
                );

                if (!guildCommand)
                  GuildSpecificCommands.push({
                    id: guild,
                    commands: [command],
                  });
                else guildCommand.commands.push(command);
              }
            else GlobalApplicationCommands.push(command);

            break;
          }
        }
      });

    try {
      await this.application.bulkEditGlobalCommands(GlobalApplicationCommands);

      //Bulk Guild Commands
      if (GuildSpecificCommands.length) {
        for (const guild of GuildSpecificCommands) {
          try {
            await this.application.bulkEditGuildCommands(
              guild.id,
              guild.commands
            );
          } catch (e) {
            throw new Error(
              `Failed to bulk edit guild commands for guild ${guild.id}: ${e}`
            );
          }
        }
      }

      this.constants.utils.log(
        "Main",
        `${GlobalApplicationCommands.length} global commands loaded.`
      );
    } catch (e) {
      throw new Error(`Failed to reload application commands: ${e}`);
    }
  };
}
