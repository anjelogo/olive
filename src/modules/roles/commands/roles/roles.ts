import { Guild, Member, Role } from "eris";
import ApplicationCommandManager from "../../../../Base/Application/ApplicationCommandManager";
import ComponentManager from "../../../../Base/Application/ComponentManger";
import FollowupManager from "../../../../Base/Application/FollowupManager";
import { ApplicationCommandOption, ApplicationComponents } from "../../../../Base/Application/types";
import Command from "../../../../Base/Command";
import Bot from "../../../../main";
import Main from "../../../main/main";
import { moduleData } from "../../main";

export default class Roles extends Command {

	constructor(bot: Bot) {

		super(bot);

		this.commands = ["roles"];
		this.description = "Grab or remove a role";
		this.example = "role add";
		this.options = [
			{
				type: 2,
				name: "list",
				description: "Edit the roles list",
				permissions: ["roles.list.edit"],
				options: [
					{
						type: 1,
						name: "add",
						description: "Add a role to the roles list",
						options: [
							{
								type: 8,
								name: "role",
								description: "The role you want to add",
								required: true
							}
						]
					}, {
						type: 1,
						name: "remove",
						description: "Remove a role from the roles list",
						options: [
							{
								type: 8,
								name: "role",
								description: "The role you want to remove",
								required: true
							}
						]
					}
				]
			}, {
				type: 1,
				name: "add",
				description: "Add a role",
				permissions: ["roles.add.self"]
			}, {
				type: 1,
				name: "remove",
				description: "Remove a role",
				permissions: ["roles.remove.self"]
			}
		];

	}

	readonly execute = async (interaction: ApplicationCommandManager): Promise<ApplicationCommandManager | FollowupManager | undefined> => {
		await interaction.defer();

		const mainModule: Main = this.bot.getModule("Main"),
			guild: Guild = interaction.guild as Guild,
			member: Member = interaction.member as Member,
			data: moduleData = await this.bot.getModuleData("Roles", guild) as moduleData,
			botMember: Member = this.bot.findMember(guild, this.bot.user.id) as Member,
			botHighestRoleID = botMember.roles
				.map((r) => 
					({
						name: (this.bot.findRole(guild, r) as Role).name,
						position: (this.bot.findRole(guild, r) as Role).position
					}))
				.sort((a, b) => b.position - a.position).map((r) => r.name),
			botHighestRole: Role = this.bot.findRole(guild, botHighestRoleID[0]) as Role,
			memberHighestRoleID = member.roles.length
				? member.roles
					.map((r) => 
						({
							name: (this.bot.findRole(guild, r) as Role).name,
							position: (this.bot.findRole(guild, r) as Role).position
						}))
					.sort((a, b) => b.position - a.position).map((r) => r.name)
				: guild.id,
			memberHighestRole: Role = this.bot.findRole(guild, memberHighestRoleID[0]) as Role,
			subcommand = (interaction.options as ApplicationCommandOption[])[0];

		switch(subcommand.name) {

		case "list": {

			const suboption = (subcommand.options as ApplicationCommandOption[])[0],
				suboptionvalue = (suboption.options as ApplicationCommandOption[])[0].value as string;

			switch (suboption.name) {

			case "add": {
				if (data.roles.includes(suboptionvalue))
					return interaction.deny("That role is already in the roles list!");

				const role: Role = this.bot.findRole(guild, suboptionvalue) as Role;

				if (!role)
					return interaction.deny("I could not find that role");

				if (role.position > memberHighestRole.position && !member.permissions.has("administrator"))
					return interaction.deny(`That role's position is higher than your highest role, ${memberHighestRole.mention}. Perhaps try moving your role higher to solve this problem.`);

				if (role.position > botHighestRole.position)
					return interaction.deny(`That role's position is higher than my highest role, ${botHighestRole.mention}. Perhaps try moving my role higher to solve this problem.`);

				try {
					data.roles.push(role.id);
					await this.bot.updateModuleData("Roles", data, guild);
					return interaction.reply(`${this.bot.constants.emojis.tick} Added role ${role.mention} to the roles list!`);
				} catch (e) {
					return interaction.deny("Error trying to add role to roles list!");
				}
			}

			case "remove": {
				if (!data.roles.includes(suboptionvalue))
					return interaction.deny("That role isn't in the roles list!");

				const role: Role = this.bot.findRole(guild, suboptionvalue) as Role;

				if (!role)
					return interaction.deny("I could not find that role");

				if (role.position > memberHighestRole.position)
					return interaction.deny(`That role's position is higher than your highest role, ${memberHighestRole.mention}. Perhaps try moving my role higher to solve this problem.`);

				try {
					const i = data.roles.indexOf(role.id);
					if (i > -1) data.roles.splice(i, 1);

					await this.bot.updateModuleData("Roles", data, guild);
					return interaction.reply(`${this.bot.constants.emojis.tick} Removed role ${role.mention} from the roles list!`);
				} catch (e) {
					return interaction.deny("Error trying to add role to roles list!");
				}
			}

			}

			break;
		}

		case "add": {
			let roles: Role[] = [];
			
			for (const r of data.roles) {
				const role: Role = this.bot.findRole(guild, r) as Role;

				if (!role) continue;

				if (member.roles.includes(role.id)) continue;
				if (role.position > botHighestRole.position) continue;

				roles.push(role);
			}
			if (await mainModule.hasPerm(member, "roles.add.self.*"))
				for (const r of guild.roles.map((r) => r.id )) {
					const role: Role = this.bot.findRole(guild, r) as Role;

					if (!role) continue;

					if (member.roles.includes(role.id)) continue;
					if (role.position >= botHighestRole.position) continue;
					if (member.roles.length && role.position > memberHighestRole.position && !member.permissions.has("administrator")) continue;
					if (role.id === guild.id) continue;
					if (role.managed) continue;

					roles.push(role);
				}

			roles = [...new Set(roles)];

			if (!roles.length)
				return interaction.deny("There are no roles you can get");

			const components: ApplicationComponents[] = [
				{
					type: 1,
					components: [
						{
							type: 3,
							placeholder: "Choose roles",
							custom_id: "roles_addroles",
							max_values: roles.length,
							min_values: 1,
							options: roles.map((r) => ({ label: r.name, value: r.id }))
						}
					]
				}, {
					type: 1,
					components: [
						{
							type: 2,
							style: 4,
							label: "Cancel",
							custom_id: "roles_cancel"
						}
					]
				}
			];

			try {
				return interaction.reply(
					{
						content: `${this.bot.constants.emojis.tick} Select the role(s) below you want to recieve.`,
						embeds: [],
						components
					}
				);
			} catch (e) {
				return interaction.deny("Error getting roles list.");
			}
		}

		case "remove": {
			const roles: Role[] = [];
			
			for (const r of data.roles) {
				const role: Role = this.bot.findRole(guild, r) as Role;

				if (!role) continue;

				if (!member.roles.includes(role.id)) continue;
				if (role.position > botHighestRole.position) continue;

				roles.push(role);
			}
			if (await mainModule.hasPerm(member, "roles.remove.self.*"))
				for (const r of guild.roles.map((r) => r.id )) {
					const role: Role = this.bot.findRole(guild, r) as Role;

					if (!role) continue;

					if (!member.roles.includes(role.id)) continue;
					if (role.position >= botHighestRole.position) continue;
					if (member.roles.length && role.position > memberHighestRole.position && !member.permissions.has("administrator")) continue;
					if (role.managed) continue;

					roles.push(role);
				}

			if (!roles.length)
				return interaction.deny("There are no roles you can remove");

			const components: ApplicationComponents[] = [
				{
					type: 1,
					components: [
						{
							type: 3,
							placeholder: "Choose roles",
							custom_id: "roles_removeroles",
							max_values: roles.length,
							min_values: 1,
							options: roles.map((r) => ({ label: r.name, value: r.id }))
						}
					]
				}, {
					type: 1,
					components: [
						{
							type: 2,
							style: 4,
							label: "Cancel",
							custom_id: "roles_cancel"
						}
					]
				}
			];

			try {
				return interaction.reply(
					{
						content: `${this.bot.constants.emojis.tick} Select the role(s) below you want to remove.`,
						embeds: [],
						components
					}
				);
			} catch (e) {
				return interaction.deny("Error getting roles list.");
			}
		}

		}

	}

	readonly update = async (component: ComponentManager): Promise<ApplicationCommandManager | FollowupManager | undefined> => {

		const interaction = component.root,
			guild: Guild = interaction.guild as Guild,
			member: Member = interaction.member as Member;

		switch (component.name) {

		case "roles_addroles": {
			interaction.defer();

			if (!component.values.length) {
				component.ack();
				return;
			}

			const names = [],
				promises = [];
			
			let	failed = 0;

			for (const value of component.values) {
				const role: Role = this.bot.findRole(guild, value) as Role;

				if (!role) {
					failed++;
					continue;
				}

				names.push(role.mention);
				promises.push(await member.addRole(role.id).catch(() => failed++));
			}

			await component.ack();
			try {
				await Promise.all(promises);
				await interaction.edit(
					{
						content: `${this.bot.constants.emojis.tick} You have recieved the role(s): ${names.join(", ")}.`,
						components: []
					}
				);

				if (failed > 0) {
					interaction.followup(
						{
							content: `There was a problem adding **${failed.toString()}** roles.`,
							hidden: true
						}
					);
				}
				return;
			} catch (e) {
				return interaction.deny("There was an error.", { components: [] });
			}
		}

		case "roles_removeroles": {
			interaction.defer();

			if (!component.values.length) {
				component.ack();
				return;
			}

			const names = [],
				promises = [];
			
			let	failed = 0;

			for (const value of component.values) {
				const role: Role = this.bot.findRole(guild, value) as Role;

				if (!role) {
					failed++;
					continue;
				}

				names.push(role.mention);
				promises.push(await member.removeRole(role.id).catch(() => failed++));
			}

			await component.ack();
			try {
				await Promise.all(promises);
				await interaction.edit(
					{
						content: `${this.bot.constants.emojis.tick} The following role(s) were removed: ${names.join(", ")}.`,
						components: []
					}
				);

				if (failed > 0) {
					interaction.followup(
						{
							content: `There was a problem removing **${failed.toString()}** roles.`,
							hidden: true
						}
					);
				}
				return;
			} catch (e) {
				return interaction.deny("There was an error.", { components: [] });
			}
		}

		case "roles_cancel": {
			component.ack();

			return interaction.edit(`${this.bot.constants.emojis.x} Cancelled`, { components: [] });
		}

		}

	}

}