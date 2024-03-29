/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import Eris, { ApplicationCommandStructure, Client, ClientOptions, Guild, GuildChannel, Member, Message, Role, TextChannel, User } from "eris";
import { Constants, Entity, Permnodes } from "./resources/interfaces";
import { promises as fs } from "fs";
import monk, { IMonkManager } from "monk";
import { Auth } from "./resources/auth";
import * as Config from "./resources/config";
import * as utils from "./resources/utils";
import Command from "./Base/Command";
import Module from "./Base/Module";
import { CustomData } from "./modules/main/internals/CustomDataHandler";

interface ExtendedOptions extends ClientOptions {
	disabledModules?: ("Main" | "VC" | "Roles")[];
}

export default class Bot extends Client {

	readonly name: string;
	readonly perms: Permnodes[]
	readonly events: any[];
	readonly constants: Constants;
	readonly disabledModules: string[];
	readonly db: IMonkManager;

	public modules: any[];
	public commands: Command[];

	public interactionCustomData: CustomData[];

	constructor(token: string, options?: ExtendedOptions) {
		super(token, options);

		this.name = Config.name;
		this.perms = [];
		this.events = [];
		this.modules = [];
		this.commands = [];
		this.interactionCustomData = [];
		this.constants = {
			emojis: require("./resources/emojis").default,
			config: Config,
			utils: utils
		};
		this.disabledModules = (options && options.disabledModules) ? [...options.disabledModules] : [];
		this.db = monk(Auth.database.replace("{db}", this.name).replace(" ", "_"));

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

	readonly reload = async (): Promise<void> => {
		const GlobalApplicationCommands: ApplicationCommandStructure[] = [],
			GuildSpecificCommands: { id: string; commands: ApplicationCommandStructure[] }[] = [];

		this.commands.filter((c) => !c.disabled).forEach(async (c: Command) => {
			if (!c.type) {
				const obj: ApplicationCommandStructure = {
					name: c.commands[0],
					description: c.description,
					type: Eris.Constants.ApplicationCommandTypes.CHAT_INPUT
				};
		
				if (c.options) obj.options = c.options;
	
				if (c.guildSpecific && c.guildSpecific.length)
					for (const guild of c.guildSpecific) {
						const guildCommand = GuildSpecificCommands.find((gc) => gc.id === guild);
	
						if (!guildCommand)
							GuildSpecificCommands.push({ id: guild, commands: [obj] });
						else guildCommand.commands.push(obj);
					}
				else
					GlobalApplicationCommands.push(obj);
			}
			else if (c.type === Eris.Constants.ApplicationCommandTypes.MESSAGE || c.type === Eris.Constants.ApplicationCommandTypes.USER) {
				const obj: ApplicationCommandStructure = {
					name: c.commands[0],
					type: c.type
				};
				GlobalApplicationCommands.push(obj);
			}

		});

		try {
			await this.bulkEditCommands(GlobalApplicationCommands);

			//Bulk Guild Commands
			if (GuildSpecificCommands.length) {
				for (const guild of GuildSpecificCommands) {
					try {
						await this.bulkEditGuildCommands(guild.id, guild.commands);
					}
					catch (e) {
						continue;
					}
				}
			}

			this.constants.utils.log("Main", `${GlobalApplicationCommands.length} global commands loaded.`);
		} catch (e) {
			throw console.error(e);
		}
	}

	readonly findUser = (query: string | undefined): User | undefined => {
		if (!query) return;

		if (/^\d+$/.test(query))
			return this.users.get(query);
		else if (/^<@!?\d+>$/.test(query))
			return this.users.get((query.match(/\d+/) as RegExpMatchArray)[0]);
		else if (/^\w+#\d{4}$/.test(query))
			return this.users
				.find((u: User) => 
					u.username.toLowerCase() === (query.toLowerCase().match(/^\w+/) as RegExpMatchArray)[0]
					&& u.discriminator === (query.match(/\d+/) as RegExpMatchArray)[0].toString()
				);
		else if (this.users.find((u: User) => u.username.toLowerCase() === query.toLowerCase()))
			return this.users.find((u: User) => u.username.toLowerCase() === query.toLowerCase());
	}

	readonly findGuild = (query: string | undefined): Guild | undefined => {
		if (!query) return;

		if (/^\d+$/.test(query))
			return this.guilds.get(query);
		else if (this.guilds.find((g: Guild) => g.name.toLowerCase() === query.toLowerCase()))
			return this.guilds.find((g: Guild) => g.name.toLowerCase() === query.toLowerCase());
	}

	readonly findMember = (guild: Guild, query: string | undefined): Member | undefined => {
		if (!query || !guild) return;

		if (/^\d+$/.test(query))
			return guild.members.get(query);
		else if (/^<@!?\d+>$/.test(query))
			return guild.members.get((query.match(/\d+/) as RegExpMatchArray)[0]);
		else if (/^\w+#\d{4}$/.test(query))
			return guild.members
				.find((m: Member) => 
					m.username.toLowerCase() === (query.toLowerCase().match(/^\w+/) as RegExpMatchArray)[0]
					&& m.discriminator === (query.match(/\d+/) as RegExpMatchArray)[0].toString()
				);
		else if (guild.members.find((m: Member) => m.username.toLowerCase() === query.toLowerCase()))
			return guild.members.find((m: Member) => m.username.toLowerCase() === query.toLowerCase());
	}

	readonly findChannel = (guild: Guild, query: string | undefined): GuildChannel | undefined => {
		if (!query || !guild) return;

		if (/^\d+$/.test(query))
			return guild.channels.get(query);
		else if (/^<#\d+>$/.test(query))
			return guild.channels.get((query.match(/\d+/) as RegExpMatchArray)[0]);
		else if (guild.channels.find((c: GuildChannel) => c.name.toLowerCase() === query.toLowerCase()))
			return guild.channels.find((c: GuildChannel) => c.name.toLowerCase() === query.toLowerCase());
	}

	readonly findRole = (guild: Guild, query: string | undefined): Role | undefined => {
		if (!query || !guild) return;

		if (/^\d+$/.test(query))
			return guild.roles.get(query);
		else if (/^<#\d+>$/.test(query))
			return guild.roles.get((query.match(/\d+/) as RegExpMatchArray)[0]);
		else if (guild.roles.find((r: Role) => r.name.toLowerCase() === query.toLowerCase()))
			return guild.roles.find((r: Role) => r.name.toLowerCase() === query.toLowerCase());
	}

	readonly findMessage = (channel: TextChannel, query: string | undefined): Message | undefined => {
		if (!query || !channel) return;

		if (/^\d+$/.test(query))
			return channel.messages.get(query);
		else if (channel.messages.find((m: Message) => m.content.toLowerCase() === query.toLowerCase()))
			return channel.messages.find((m: Message) => m.content.toLowerCase() === query.toLowerCase());
	}

	readonly findEntity = (guild: Guild, query: string | undefined): Entity | undefined => {
		if (!query || !guild) return;

		const obj: Entity = {
			type: "undefined"
		};

		if (guild.roles.get(query)) {
			obj.role = guild.roles.get(query);
			obj.type = "role";
		}
		if (guild.members.get(query)) {
			obj.member = guild.members.get(query);
			obj.type = "member";
		}

		return (obj.type === "undefined") ? undefined : obj;
	}

	readonly getModule = (name: string): Module | any => {
		const Module = this.modules.find((m: Module) => m.name === name);

		return Module;
	}

	readonly getModuleData = async (name: string, guild: string | Guild): Promise<unknown> => {
		const Module: Module = this.getModule(name);

		if (typeof guild === "string") guild = this.findGuild(guild) as Guild;

		if (!guild) return undefined;

		return await Module.data(guild);
	}

	readonly getAllData = async (name: string): Promise<unknown> => {
		return await this.db.get(name).find({});
	}

	readonly updateModuleData = async (name: string, data: any, guild: string | Guild): Promise<unknown> => {
		const Module: Module = this.getModule(name);

		if (typeof guild === "string") guild = this.findGuild(guild) as Guild;

		if (!guild) throw new Error("Could not find guild!");

		return await this.db.get(Module.name).findOneAndUpdate({ guildID: guild.id }, { $set: data });
	}

}