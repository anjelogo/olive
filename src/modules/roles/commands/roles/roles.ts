import { ActionRow, CommandInteraction, ComponentInteraction, Constants, Guild, InteractionComponentSelectMenuData, InteractionDataOptionsSubCommand, InteractionDataOptionsSubCommandGroup, Member, Message, Role } from "eris";
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
				type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
				name: "list",
				description: "Edit the roles list",
				permissions: ["roles.list.edit"],
				options: [
					{
						type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
						name: "add",
						description: "Add a role to the roles list",
						options: [
							{
								type: Constants.ApplicationCommandOptionTypes.ROLE,
								name: "role",
								description: "The role you want to add",
								required: true
							}
						]
					}, {
						type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
						name: "remove",
						description: "Remove a role from the roles list",
						options: [
							{
								type: Constants.ApplicationCommandOptionTypes.ROLE,
								name: "role",
								description: "The role you want to remove",
								required: true
							}
						]
					}
				]
			}, {
				type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
				name: "add",
				description: "Add a role",
				permissions: ["roles.add.self"]
			}, {
				type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
				name: "remove",
				description: "Remove a role",
				permissions: ["roles.remove.self"]
			}
		];

	}

	readonly execute = async (interaction: CommandInteraction): Promise<Message | void> => {
		await interaction.defer();

		const mainModule: Main = this.bot.getModule("Main"),
			guild: Guild = this.bot.findGuild(interaction.guildID!!) as Guild,
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
			subcommand = interaction.data.options?.[0]!! as InteractionDataOptionsSubCommandGroup;

		switch(subcommand.name) {

		case "list": {
			const suboption = subcommand.options?.[0] as InteractionDataOptionsSubCommand,
				suboptionvalue = suboption.options?.[0].value as string;

			switch (suboption.name) {
			case "add": {
				if (data.roles.includes(suboptionvalue))
					return interaction.createMessage("That role is already in the roles list!");

				const role: Role = this.bot.findRole(guild, suboptionvalue) as Role;

				if (!role)
					return interaction.createMessage("I could not find that role");

				if (role.position > memberHighestRole.position && !member.permissions.has("administrator"))
					return interaction.createMessage(`That role's position is higher than your highest role, ${memberHighestRole.mention}. Perhaps try moving your role higher to solve this problem.`);

				if (role.position > botHighestRole.position)
					return interaction.createMessage(`That role's position is higher than my highest role, ${botHighestRole.mention}. Perhaps try moving my role higher to solve this problem.`);

				try {
					data.roles.push(role.id);
					await this.bot.updateModuleData("Roles", data, guild);
					return interaction.createMessage(`${this.bot.constants.emojis.tick} Added role ${role.mention} to the roles list!`);
				} catch (e) {
					return interaction.createMessage("Error trying to add role to roles list!");
				}
			}

			case "remove": {
				if (!data.roles.includes(suboptionvalue))
					return interaction.createMessage("That role isn't in the roles list!");

				const role: Role = this.bot.findRole(guild, suboptionvalue) as Role;

				if (!role)
					return interaction.createMessage("I could not find that role");

				if (role.position > memberHighestRole.position)
					return interaction.createMessage(`That role's position is higher than your highest role, ${memberHighestRole.mention}. Perhaps try moving my role higher to solve this problem.`);

				try {
					const i = data.roles.indexOf(role.id);
					if (i > -1) data.roles.splice(i, 1);

					await this.bot.updateModuleData("Roles", data, guild);
					return interaction.createMessage(`${this.bot.constants.emojis.tick} Removed role ${role.mention} from the roles list!`);
				} catch (e) {
					return interaction.createMessage("Error trying to add role to roles list!");
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
				return interaction.createMessage("There are no roles you can get");

			const components: ActionRow[] = [
				{
					type: 1,
					components: [
						{
							type: 3,
							placeholder: "Choose roles",
							custom_id: `roles_${interaction.member?.id}_addroles`,
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
							custom_id: `roles_${interaction.member?.id}_cancel`
						}
					]
				}
			];

			try {
				return interaction.createMessage(
					{
						content: `${this.bot.constants.emojis.tick} Select the role(s) below you want to recieve.`,
						embeds: [],
						components
					}
				);
			} catch (e) {
				return interaction.createMessage("Error getting roles list.");
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
				return interaction.createMessage("There are no roles you can remove");

			const components: ActionRow[] = [
				{
					type: 1,
					components: [
						{
							type: 3,
							placeholder: "Choose roles",
							custom_id: `roles_${interaction.member?.id}_removeroles`,
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
							custom_id: `roles_${interaction.member?.id}_cancel`
						}
					]
				}
			];

			try {
				return interaction.createMessage(
					{
						content: `${this.bot.constants.emojis.tick} Select the role(s) below you want to remove.`,
						embeds: [],
						components
					}
				);
			} catch (e) {
				return interaction.createMessage("Error getting roles list.");
			}
		}

		}

	}

	readonly update = async (component: ComponentInteraction): Promise<Message | void> => {

		const guild: Guild = this.bot.findGuild(component.guildID) as Guild,
			member: Member = component.member as Member;

		console.log(component);


		switch (component.data.custom_id.split("_")[2]) {

		case "addroles": {

			if (!(component.data as InteractionComponentSelectMenuData).values.length) {
				return;
			}

			const names = [],
				promises = [];
			
			let	failed = 0;

			for (const value of (component.data as InteractionComponentSelectMenuData).values) {
				const role: Role = this.bot.findRole(guild, value) as Role;

				if (!role) {
					failed++;
					continue;
				}

				names.push(role.mention);
				promises.push(await member.addRole(role.id).catch(() => failed++));
			}

			try {
				await Promise.all(promises);
				await component.editParent(
					{
						content: `${this.bot.constants.emojis.tick} You have recieved the role(s): ${names.join(", ")}.`,
						components: []
					}
				);

				if (failed > 0) {
					component.createMessage(
						{
							content: `There was a problem adding **${failed.toString()}** roles.`,
							flags: Constants.MessageFlags.EPHEMERAL
						}
					);
				}
				return;
			} catch (e) {
				throw new Error(e as string);
				return component.editParent({ content: "There was an error", components: undefined });
			}
		}

		case "removeroles": {
			component.deferUpdate();

			if (!(component.data as InteractionComponentSelectMenuData).values.length) {
				component.acknowledge();
				return;
			}

			const names = [],
				promises = [];
			
			let	failed = 0;

			for (const value of (component.data as InteractionComponentSelectMenuData).values) {
				const role: Role = this.bot.findRole(guild, value) as Role;

				if (!role) {
					failed++;
					continue;
				}

				names.push(role.mention);
				promises.push(await member.removeRole(role.id).catch(() => failed++));
			}

			try {
				await Promise.all(promises);
				await component.editParent(
					{
						content: `${this.bot.constants.emojis.tick} The following role(s) were removed: ${names.join(", ")}.`,
						components: []
					}
				);

				if (failed > 0) {
					component.createMessage(
						{
							content: `There was a problem removing **${failed.toString()}** roles.`,
							flags: Constants.MessageFlags.EPHEMERAL
						}
					);
				}
				return;
			} catch (e) {
				return component.editParent({ content: "There was an error", components: undefined });
			}
		}

		case "cancel": {
			component.deferUpdate();

			return component.editParent({ content: "Cancelled", components: undefined });
		}

		}

	}

}