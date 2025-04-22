import { Constants, CreateApplicationCommandOptions, CreateChatInputApplicationCommandOptions, CreateGuildApplicationCommandOptions, Guild, GuildChannel, Member, Message, Role, TextChannel, User } from "oceanic.js";
import { Entity } from "../resources/interfaces";
import Command from "./Command";
import Module from "./Module";
import Olive from "../main";

export default class ExtendedClient extends Olive {

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

	readonly findGuild = (query: string | undefined | null): Guild | undefined => {
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

	readonly getModuleData = async (name: string, guildID: string): Promise<unknown> => {
		const Module: Module = this.getModule(name);

		if (!guildID) return undefined;

		return await Module.data(guildID);
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

	readonly reload = async (): Promise<void> => {
		const GlobalApplicationCommands: CreateApplicationCommandOptions[] = [],
			GuildSpecificCommands: { id: string; commands: CreateGuildApplicationCommandOptions[] }[] = [];

		this.commands.filter((c) => !c.disabled).forEach(async (c: Command) => {
			if (!c.type) {
				const command: CreateChatInputApplicationCommandOptions = {
					name: c.commands[0],
					description: c.description,
					type: Constants.ApplicationCommandTypes.CHAT_INPUT
				};
		
				if (c.options) command.options = c.options;
	
				if (c.guildSpecific && c.guildSpecific.length)
					for (const guild of c.guildSpecific) {
						const guildCommand = GuildSpecificCommands.find((gc) => gc.id === guild);
	
						if (!guildCommand)
							GuildSpecificCommands.push({ id: guild, commands: [command] });
						else guildCommand.commands.push(command);
					}
				else
					GlobalApplicationCommands.push(command);
			}
			else if (c.type === Constants.ApplicationCommandTypes.MESSAGE || c.type === Constants.ApplicationCommandTypes.USER) {
				const obj: CreateApplicationCommandOptions = {
					name: c.commands[0],
					type: c.type
				};
				GlobalApplicationCommands.push(obj);
			}

		});

		try {
			await this.application.bulkEditGlobalCommands(GlobalApplicationCommands);

			//Bulk Guild Commands
			if (GuildSpecificCommands.length) {
				for (const guild of GuildSpecificCommands) {
					try {
						await this.application.bulkEditGuildCommands(guild.id, guild.commands);
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
	};

}