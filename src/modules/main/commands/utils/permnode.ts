import { Embed, EmbedField, Guild, Member, Role } from "eris";
import ApplicationCommandManager from "../../../../Base/Application/ApplicationCommandManager";
import ComponentManager from "../../../../Base/Application/ComponentManger";
import FollowupManager from "../../../../Base/Application/FollowupManager";
import { ApplicationCommandOption, ApplicationComponents } from "../../../../Base/Application/types";
import Command from "../../../../Base/Command";
import Bot from "../../../../main";
import { Entity } from "../../../../resources/interfaces";
import { Permissions } from "../../internals/permissions";
import { moduleData } from "../../main";

export default class Permnode extends Command {
	
	constructor(bot: Bot) {

		super(bot);

		this.commands = ["permnode", "permnodes", "permissions", "permission", "perms", "perm"];
		this.description = "Edit Permissions";
		this.example = "permnode set user abdoul permnode.view true";
		this.permissions = ["main.permnode.view"];

		this.options = [
			{
				name: "edit",
				description: "Edit permissions for a user/role",
				permissions: ["main.permnode.edit"],
				type: 1,
				options: [
					{
						name: "entity",
						description: "The user or role you want to edit",
						type: 9,
						required: true,
					}, {
						name: "permission",
						description: "The permission you want to allow/deny",
						type: 3,
						required: true,
					}, {
						name: "boolean",
						description: "Allow or deny the permission",
						type: 5,
						required: true
					}
				]
			}, {
				name: "remove",
				description: "Remove permissions from a user/role",
				permissions: ["main.permnode.remove"],
				type: 1,
				options: [
					{
						name: "entity",
						description: "The user or role you want to edit",
						type: 9,
						required: true,
					}, {
						name: "permission",
						description: "The permission you want to remove",
						type: 3,
						required: true,
					}
				]
			}, {
				name: "view",
				description: "View user/role's permissions",
				permissions: ["main.permnode.view"],
				type: 1,
				options: [
					{
						name: "entity",
						description: "The user or role",
						type: 9,
						required: true,
					}
				]
			}
		];
	}

	readonly execute = async (interaction: ApplicationCommandManager): Promise<ApplicationCommandManager | FollowupManager | undefined> => {
		await interaction.defer();
		
		const guild = interaction.guild as Guild,
			data: moduleData = (await this.bot.getModuleData("Main", guild) as unknown) as moduleData,
			permissions: Permissions[] = data.permissions,
			subcommand = (interaction.options as ApplicationCommandOption[])[0];

		switch (subcommand.name) {
		case "edit": {
			const entity: Entity | undefined = this.bot.findEntity(guild, (subcommand.options as ApplicationCommandOption[])[0].value as string);
			
			console.log(entity);
			
			if (!entity) return interaction.deny("I could not find that entity!");
			const permnode = this.bot.perms.find((perm) => perm.name === (subcommand.options as ApplicationCommandOption[])[1].value as string);
			if (!permnode) return interaction.deny("I could not find that permnode!");

			const value = (subcommand.options as ApplicationCommandOption[])[2].value as boolean;

			switch (entity.type) {

			case "member": {
				if (!entity.member) return interaction.reply(`${this.bot.constants.emojis.warning.red} An error occured.`);
				const member = entity.member as Member;

				const userData: Permissions | undefined = (permissions.find((p: Permissions) => p.userID === member.id));
				if (!userData) {
					const newPerm: Permissions = {
						userID: member.id,
						permissions: [{ permission: permnode.name, value }]
					};
					permissions.push(newPerm);
				} else {
					const perms = userData.permissions;

					if (perms.filter((p) => p.permission === permnode.name && p.value === value).length)
						return interaction.deny(`User \`${member.username}\` already has \`${permnode.name}\` set as \`${value}\``);

					perms.push({ permission: permnode.name, value });
				}

				data.permissions = permissions;
				await this.bot.updateModuleData("Main", data, guild);
				
				return interaction.reply(`${this.bot.constants.emojis.tick} Successfully applied change(s) to user \`${member.username}\`:\n\n+ \`${permnode.name} (${value.toString()})\``);
			}

			case "role": {
				if (!entity.role) return interaction.reply(`${this.bot.constants.emojis.warning.red} An error occured.`);
				const role = entity.role as Role;

				const roleData: Permissions | undefined = (permissions.find((p: Permissions) => p.roleID === role.id));
				if (!roleData) {
					const newPerm: Permissions = {
						roleID: role.id,
						permissions: [{ permission: permnode.name, value }]
					};
					permissions.push(newPerm);
				} else {
					const perms = roleData.permissions;

					if (perms.filter((p) => p.permission === permnode.name && p.value === value).length)
						return interaction.deny(`Role \`${role.name}\` already has \`${permnode.name}\` set as \`${value}\``);

					perms.push({ permission: permnode.name, value });
				}

				data.permissions = permissions;
				await this.bot.updateModuleData("Main", data, guild);
				
				return interaction.reply(`${this.bot.constants.emojis.tick} Successfully applied change(s) to role \`${role.name}\`:\n\n+ \`${permnode.name} (${value.toString()})\``);
			}

			}


			break;
		}


		case "remove": {
			const entity: Entity | undefined = this.bot.findEntity(guild, (subcommand.options as ApplicationCommandOption[])[0].value as string);
			if (!entity) return interaction.deny("I could not find that entity!");
			const permnode = this.bot.perms.find((perm) => perm.name === (subcommand.options as ApplicationCommandOption[])[1].value as string);
			if (!permnode) return interaction.deny("I could not find that permnode!");

			switch (entity.type) {

			case "member": {
				if (!entity.member) return interaction.reply(`${this.bot.constants.emojis.warning.red} An error occured.`);
				const member = entity.member as Member;

				const userData: Permissions | undefined = (permissions.find((p: Permissions) => p.userID === member.id));
				if (!userData) {
					return interaction.deny(`That user does not have the permission \`${permnode.name}\`!`);
				} else {
					const perms = userData.permissions;

					if (!perms.find((p) => p.permission === permnode.name))
						return interaction.deny(`That user does not have the permission \`${permnode.name}\`!`);

					const i = perms.findIndex((p) => p.permission === permnode.name);
					perms.slice(i, 1);
				}

				data.permissions = permissions;
				await this.bot.updateModuleData("Main", data, guild);
				return interaction.reply(`${this.bot.constants.emojis.tick}`);
			}

			case "role": {
				if (!entity.role) return interaction.reply(`${this.bot.constants.emojis.warning.red} An error occured.`);
				const role = entity.role as Role;

				const roleData: Permissions | undefined = (permissions.find((p: Permissions) => p.roleID === role.id));
				if (!roleData) {
					return interaction.deny(`That role does not have the permission \`${permnode.name}\`!`);
				} else {
					const perms = roleData.permissions;

					if (!perms.find((p) => p.permission === permnode.name))
						return interaction.deny(`That role does not have the permission \`${permnode.name}\`!`);

					const i = perms.findIndex((p) => p.permission === permnode.name);
					perms.slice(i, 1);
				}

				data.permissions = permissions;
				await this.bot.updateModuleData("Main", data, guild);
				return interaction.reply(`${this.bot.constants.emojis.tick}`);
			}

			}


			break;
		}

		case "view": {
			const entity: Entity | undefined = this.bot.findEntity(guild, (subcommand.options as ApplicationCommandOption[])[0].value as string);
			if (!entity) return interaction.deny("I could not find that entity!");

			switch (entity.type) {

			case "member": {
				if (!entity.member) return interaction.reply(`${this.bot.constants.emojis.warning.red} An error occured.`);

				const member = entity.member as Member,
					userData: Permissions | undefined = (permissions.find((p: Permissions) => p.userID === member.id)),
					strings: string[] = [];

				let perms: {
					name: string;
					description: string;
					value: boolean;
					hoist: number;
				}[] = [];

				perms.push(...this.bot.perms.filter((p) => p.default).map((p) => ({ name: p.name, description: p.description, value: true, hoist: 0 })));

				if (userData) {
					const userPerms = [...userData.permissions];
					for (const perm of userPerms) {
						const permnode = this.bot.perms.find((p) => p.name === perm.permission);
						perms.push({ name: perm.permission, value: perm.value, description: permnode ? permnode.description : "Unknown", hoist: perm.value ? 0 : 1 });
					}
				}

				perms.sort((a, b) => a.hoist - b.hoist);

				for (const perm of perms) {
					perms.map((p) => p.name);
					const dupes = perms.filter((p) => p.name === perm.name);
					if (dupes.length) {
						const i = perms.findIndex((p) => p.name === perm.name && p.value === true);
						if (i > -1) perms.splice(i, 1);
					}
				}

				perms = [...new Set(perms)];

				for (const perm of perms) {
					strings.push(`${perm.value ? this.bot.constants.emojis.tick : this.bot.constants.emojis.x} \`${perm.name}\` - **${perm.description.toString()}**`);
				}

				const roles: {
					name: string;
					id: string;
				}[] = [],
					fields: EmbedField[] = [
						{
							name: "User Defined Permissions",
							value: strings.join("\n")
						}
					];

				if (member.roles.length) {
					for (const r of member.roles) {
						const roleData: Permissions | undefined = (permissions.find((p: Permissions) => p.roleID === r));

						if (!roleData) continue;

						const role: Role = this.bot.findRole(guild, r) as Role;
						roles.push({ name: role.name, id: role.id });
					}
				}

				const embed: Embed = {
					type: "rich",
					description: member.permissions.has("administrator")
						? `${this.bot.constants.emojis.warning.yellow} This user is a guild administrator! This user will bypass permissions regardless of negated permissions!`
						: undefined,
					title: `${member.username}'s Permissions`,
					fields,
					color: this.bot.constants.config.colors.default
				},
					components: ApplicationComponents[] = roles.length
						? [
							{
								type: 1,
								components: [
									{
										type: 2,
										style: 2,
										custom_id: "permnode_viewinheritance",
										label: "View inherited permissions"
									}
								]
							}
						]
						: [];

				if (roles.length)
					interaction.data = {
						entity: member.id,
						page: 0,
						roles
					};

				return interaction.reply(
					{ 
						embeds: [embed],
						components
					}
				);
			}

			case "role": {
				if (!entity.role) return interaction.reply(`${this.bot.constants.emojis.warning.red} An error occured.`);
				const role = entity.role as Role;
				
				const roleData: Permissions | undefined = (permissions.find((p: Permissions) => p.roleID === role.id));
				if (!roleData) {
					return interaction.reply(`${this.bot.constants.emojis.warning.yellow} This role has default permissions.`);
				} else {
					const allowed = roleData.permissions.filter((p) => p.value === true).map((p) => p.permission),
						denied = roleData.permissions.filter((p) => p.value === false).map((p) => p.permission);

					const embed: Embed = {
						color: this.bot.constants.config.colors.default,
						title: `${role.name}'s Permissions`,
						fields: [
							{
								name: "Allowed",
								value: `${allowed.length ? `\`${allowed.join("`, `")}\`` : "Default"}`
							}, {
								name: "Denied",
								value: `${denied.length ? `\`${denied.join("`, `")}\`` : "Default (None)"}`
							}
						],
						type: "rich"
					};

					return interaction.reply({ embeds: [embed] });
				}
			}

			}

			break;
		}

		}
	}

	readonly update = async (component: ComponentManager): Promise<ApplicationCommandManager | FollowupManager | undefined> => {

		const interaction = component.root,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			data = interaction.data as { entity: string, page: number; roles: any[] },
			guild = interaction.guild as Guild,
			member = this.bot.findMember(guild, data.entity) as Member,
			moduleData: moduleData = (await this.bot.getModuleData("Main", guild) as unknown) as moduleData,
			permissions: Permissions[] = moduleData.permissions;

		async function constructEmbed(bot: Bot, id: string) {
			const role: Role = bot.findRole(guild, id) as Role,
				roleData: Permissions | undefined = (permissions.find((p: Permissions) => p.roleID === role.id)),
				strings: string[] = [];

			let perms: {
				name: string;
				description: string;
				value: boolean;
				hoist: number;
			}[] = [];

			if (role.permissions.has("administrator"))
				perms.push({ name: "*", description: "Grants access to all module components/commands regardless of negated permissions", value: true, hoist: 0 });

			perms.push(...bot.perms.filter((p) => p.default).map((p) => ({ name: p.name, description: p.description, value: true, hoist: 0 })));

			if (roleData) {
				const rolePerms = [...roleData.permissions];
				for (const perm of rolePerms) {
					const permnode = bot.perms.find((p) => p.name === perm.permission);
					perms.push({ name: perm.permission, value: perm.value, description: permnode ? permnode.description : "Unknown", hoist: perm.value ? 0 : 1 });
				}
			}

			perms.sort((a, b) => a.hoist - b.hoist);

			for (const perm of perms) {
				perms.map((p) => p.name);
				const dupes = perms.filter((p) => p.name === perm.name);
				if (dupes.length) {
					const i = perms.findIndex((p) => p.name === perm.name && p.value === true);
					if (i > -1) perms.splice(i, 1);
				}
			}

			perms = [...new Set(perms)];

			for (const perm of perms) {
				strings.push(`${perm.value ? bot.constants.emojis.tick : bot.constants.emojis.x} \`${perm.name}\` - **${perm.description.toString()}**`);
			}

			const fields: EmbedField[] = [
				{
					name: "Permissions",
					value: strings.join("\n")
				}
			];

			const embed: Embed = {
				type: "rich",
				title: `${member.username}'s Inherited Permissions (${role.name})`,
				color: role.color !== 0 ? role.color : bot.constants.config.colors.default,
				fields
			},
				components: ApplicationComponents[] = [
					{
						type: 1,
						components: [
							{
								type: 2,
								style: 2,
								custom_id: "permnode_viewpreviousinheritance",
								label: "View Previous",
								disabled: 1 >= data.page + 1 ? true : false
							}, {
								type: 2,
								style: 2,
								custom_id: "permnode_viewnextinheritance",
								label: "View Next",
								disabled: data.roles.length <= data.page + 1 ? true : false
							}, {
								type: 2,
								style: 1,
								custom_id: "permnode_viewmemberdefined",
								label: "View Member Permissions"
							}
						]
					}
				];
			
			return {
				embed,
				components
			};
		}

		switch(component.name) {

		case "permnode_viewinheritance": {
			await interaction.defer();

			const obj = await constructEmbed(this.bot, data.roles[data.page].id);

			component.ack();
			return interaction.edit({
				embeds: [obj.embed],
				components: obj.components
			});
		}

		case "permnode_viewnextinheritance": {
			data.page++;
			await interaction.defer();

			const obj = await constructEmbed(this.bot, data.roles[data.page].id);

			component.ack();
			return interaction.edit({
				embeds: [obj.embed],
				components: obj.components
			});
		}

		case "permnode_viewpreviousinheritance": {
			data.page--;
			await interaction.defer();

			const obj = await constructEmbed(this.bot, data.roles[data.page].id);

			component.ack();
			return interaction.edit({
				embeds: [obj.embed],
				components: obj.components
			});
		}

		case "permnode_viewmemberdefined": {
			data.page = 0;
			await interaction.defer();

			interaction.options = [
				{
					name: "view",
					type: 1,
					options: [
						{
							name: "entity",
							type: 9,
							value: member.id
						}
					]
				}
			];
			component.ack();
			return this.execute(interaction);
		}

		}

	}

}