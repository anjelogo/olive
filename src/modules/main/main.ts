import { Permissions, Permission } from "./internals/permissions";
import { Permnodes } from "../../resources/interfaces";
import { CommandInteraction, Constants, Embed, EmbedField, Member, PrivateChannel } from "eris";
import Module, { moduleDataStructure } from "../../Base/Module";
import Bot from "../../main";
import Command from "../../Base/Command";

export interface moduleData extends moduleDataStructure {
	guildID: string;
	permissions: Permissions[];
	disabledModules: [];
}

export interface helpEmbed {
	content: string;
	embed: Embed;
}

export default class Main extends Module {

	readonly name: string;
	readonly version: string;
	readonly path: string;
	readonly weight: number;
	readonly db: boolean;

	constructor (bot: Bot) {
		super(bot);

		this.name = "Main";
		this.version = "1.1";
		this.path = "modules/main";
		this.weight = 0; //Load this module before everything
		this.db = true; //Uses database

	}

	readonly run = async (): Promise<void> => {
		await this.load();
	}

	readonly getPerms = async (member: Member | undefined): Promise<string[] | null> => {
		if (!member) return null;

		const moduleData: moduleData = (await this.bot.getModuleData("Main", member.guild.id) as unknown) as moduleData,
			permissions: Permissions[] = moduleData.permissions;

		let perms: string[] = [...this.bot.perms.filter((p: Permnodes) => p.default).map((p: Permnodes) => p.name)];
		const userData = permissions.find((p: Permissions) => p.userID === member.id);

		if (userData) {
			const userPerms: (Permnodes | undefined)[] = userData.permissions
				.filter((p: Permission) => p.value)
				.map((p: Permission) => this.bot.perms.find((permnode: Permnodes) => permnode.name === p.permission));

			if (userPerms)
				perms = [...(userPerms as Permnodes[]).map((p: Permnodes) => p.name)];
		}
	
		if (member.roles.length) {
			for (const r of member.roles) {
				const roleData = permissions.find((p: Permissions) => p.roleID === r);

				if (!roleData) continue;
			
				const rolePerms = roleData.permissions
					.filter((p: Permission) => p.value)
					.map((p: Permission) => this.bot.perms.find((permnode: Permnodes) => permnode.name === p.permission));

				perms = [...perms, ...(rolePerms as Permnodes[]).map((p: Permnodes) => p.name)];
			}
		}

		return perms;
	}

	readonly hasPerm = async (member: Member | undefined, perm: string): Promise<boolean> => {
		if (!member || !perm) return false;

		const masterPerm = `${perm.split(/[.\-_]/)[0]}.*`,
			permission: Permnodes | undefined = this.bot.perms.find((p: Permnodes) => p.name === perm),
			moduleData: moduleData = (await this.bot.getModuleData("Main", member.guild) as unknown) as moduleData,
			permissions: Permissions[] = moduleData.permissions;

		if (!permission || !permissions) return false;
		if (member.permissions.has("administrator")) return true;

		const perms = [...new Set(await this.getPerms(member))];

		return [masterPerm, perm, "*"].some(p => perms.includes(p));
	}

	public handlePermission = async (member: Member, permission: string[] | string, interaction?: CommandInteraction): Promise<boolean> => {
		if (typeof permission === "string") permission = [permission];

		const permissions: Permnodes[] = [];

		for (const perm of permission) {
			const permnode: Permnodes | undefined = this.bot.perms.find((p) => p.name === perm);

			if (!permnode) continue;

			const bool = await this.hasPerm(member, permnode.name);

			if (!bool) permissions.push(permnode);
		}

		if (permissions.length) {
			const embed: Embed = {
				title: "Not Enough Permissions!",
				description: `${this.bot.constants.emojis.x} You cannot perform this action. ${permissions ? `Missing Permissions: \`${permissions.map((p) => p.name).join("`, `")}\`` : ""}`,
				footer: {
					text: "Contact your server administrator if you believe this is a problem."
				},
				color: this.bot.constants.config.colors.red,
				type: "rich"
			},
				dmChannel: PrivateChannel | undefined = await this.bot.getDMChannel(member.id) as PrivateChannel;

			if (interaction) 
				interaction.createMessage({ embeds: [embed], flags: Constants.MessageFlags.EPHEMERAL });
			else if (dmChannel)
				dmChannel.createMessage({ embed });

			return false;
		}
		else return true;
	}

	public createHelpEmbed = (cmd: Command, content?: string): helpEmbed => {
		let usage: string;

		const	optStrings: string[] = [],
			fields: EmbedField[] = [];

		if (cmd.commands.length > 1) {
			fields[fields.length] = {
				name: "Aliases",
				value: `${cmd.commands.slice(1).join(", ")}`
			};
		}

		optStrings.length > 0 ? usage = `${cmd.commands[0]} ${optStrings.join(" ")}` : usage = `${cmd.commands[0]}`;

		fields[fields.length] = {
			name: "Usage",
			value: `\`${usage}\``
		};

		if (cmd.example) {
			fields[fields.length] = {
				name: "Example",
				value: `\`${cmd.example}\``
			};
		}

		if (cmd.permissions) {
			let perms: string[] = [...cmd.permissions];

			/* 			if (cmd.subcommands) {
				for (const scmd of cmd.subcommands) {
					if (scmd.permissions)
						perms = [...perms, ...scmd.permissions];
				}
			} */

			perms = [...new Set(perms)];

			fields[fields.length] = {
				name: "Permissions",
				value: `\`${perms.join("`, `")}\``
			};
		}

		const obj = {
			content: content ? content : "",
			embed: {
				title: cmd.commands[0],
				description: `**${cmd.description}**`,
				color: this.bot.constants.config.colors.default,
				fields,
				type: "rich"
			}
		};

		return obj;
	}

	readonly moduleData = {
		version: this.version,
		guildID: this.bot.constants.config.guildID,
		permissions: [],
		disabledModules: []
	}

}