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
import { ContextForKey, DeepPartial } from "./Service";

type Ctx<T extends "user" | "guild"> = T extends "guild"
  ? { guildID: string }
  : { userID: string };

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

  public getModule<K extends keyof ModuleMap>(name: K): ModuleMap[K] {
    const Module = this.modules.find((m) => m.name === name);

    if (!Module) throw new Error(`Module ${name} not found!`);

    return Module as ModuleMap[K];
  }

  public async getModuleData<
    K extends keyof ModuleDataMap<"guild"> | keyof ModuleDataMap<"user">
  >(
    name: K,
    ctx: Ctx<ContextForKey<K>>
  ): Promise<
    | ModuleDataMap<ContextForKey<K>>[keyof ModuleDataMap<ContextForKey<K>>]
    | undefined
  > {
    if (!ctx) return undefined;

    const Module = this.getModule(name as keyof ModuleMap) as Module<
      ContextForKey<K>
    >;

    if ("guildID" in ctx) {
      return (await Module.data({ guildID: ctx.guildID } as Ctx<
        ContextForKey<K>
      >)) as ModuleDataMap<ContextForKey<K>>[Extract<
        K,
        keyof ModuleDataMap<ContextForKey<K>>
      >];
    }
    if ("userID" in ctx) {
      return (await Module.data({ userID: ctx.userID } as Ctx<
        ContextForKey<K>
      >)) as ModuleDataMap<ContextForKey<K>>[Extract<
        K,
        keyof ModuleDataMap<ContextForKey<K>>
      >];
    }
  }

  public async getAllData<K extends keyof ModuleDataMap<ContextForKey<K>>>(
    name: K
  ): Promise<Array<ModuleDataMap<ContextForKey<K>>[K]>> {
    const Module = this.getModule(name as keyof ModuleMap) as Module<
      ContextForKey<K>
    >;

    if (!Module) return [] as Array<ModuleDataMap<ContextForKey<K>>[K]>;

    if (!Module.db)
      throw new Error(`Module ${Module.name} does not support a database.`);
    const data = await this.db.get(Module.name).find({});

    return data as Array<ModuleDataMap<ContextForKey<K>>[K]>;
  }

  public async updateModuleData<
    K extends keyof ModuleDataMap<ContextForKey<K>>
  >(
    name: K,
    data: DeepPartial<ModuleDataMap<ContextForKey<K>>[K]>,
    ctx: Ctx<ContextForKey<K>>
  ): Promise<ModuleDataMap<ContextForKey<K>>[K] | undefined> {
    if (!data) throw new Error("No data provided!");

    const Module = this.getModule(name as keyof ModuleMap) as Module<
      ContextForKey<K>
    >;

    if ("guildID" in ctx && ctx.guildID !== undefined) {
      const guild = this.findGuild(ctx.guildID);
      if (!guild) throw new Error("Guild not found!");

      await this.db
        .get(Module.name)
        .findOneAndUpdate({ guildID: guild.id }, { $set: data });
    } else if ("userID" in ctx && ctx.userID !== undefined) {
      const user = this.findUser(ctx.userID);
      if (!user) throw new Error("User not found!");

      await this.db
        .get(Module.name)
        .findOneAndUpdate({ userID: user.id }, { $set: data });
    }

    return data as ModuleDataMap<ContextForKey<K>>[K];
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
