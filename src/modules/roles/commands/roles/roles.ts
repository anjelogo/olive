import { CommandInteraction, ComponentInteraction, Constants, Guild, Member, Message, MessageActionRow, MessageComponentSelectMenuInteractionData, Role } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import Main from "../../../main/main";
import { moduleData } from "../../main";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";

export default class Roles extends Command {

	constructor(bot: ExtendedClient) {

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

	readonly execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {
		await interaction.defer();

		const mainModule: Main = this.bot.getModule("Main"),
			guild: Guild = this.bot.findGuild(interaction.guildID) as Guild,
			member: Member = interaction.member as Member,
			data: moduleData = await this.bot.getModuleData("Roles", guild.id) as moduleData,
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
			subcommand = interaction.data.options.raw[0].name;

		switch(subcommand) {

		case "list": {
			const suboptions = interaction.data.options.getSubCommand(true)[1];

			if (!suboptions) return interaction.createFollowup({content: "Could not find subcommand", flags: Constants.MessageFlags.EPHEMERAL});

			const role = interaction.data.options.getRole("role", true);

			switch (suboptions) {
			case "add": {
				if (data.roles.includes(role.id))
					return interaction.createFollowup({content: "That role is already in the roles list!"});

				if (!role)
					return interaction.createFollowup({content: "I could not find that role"});

				if (role.position > memberHighestRole.position && !member.permissions.has("ADMINISTRATOR"))
					return interaction.createFollowup({content: `That role's position is higher than your highest role, ${memberHighestRole.mention}. Perhaps try moving your role higher to solve this problem.`});

				if (role.position > botHighestRole.position)
					return interaction.createFollowup({content: `That role's position is higher than my highest role, ${botHighestRole.mention}. Perhaps try moving my role higher to solve this problem.`});

				try {
					data.roles.push(role.id);
					await this.bot.updateModuleData("Roles", data, guild);
					return interaction.createFollowup({content: `${this.bot.constants.emojis.tick} Added role ${role.mention} to the roles list!`});
				} catch (e) {
					return interaction.createFollowup({content: "Error trying to add role to roles list!"});
				}
			}

			case "remove": {
				if (data.roles.includes(role.id))
					return interaction.createFollowup({content: "That role is already in the roles list!"});

				if (!role)
					return interaction.createFollowup({content: "I could not find that role"});

				if (role.position > memberHighestRole.position && !member.permissions.has("ADMINISTRATOR"))
					return interaction.createFollowup({content: `That role's position is higher than your highest role, ${memberHighestRole.mention}. Perhaps try moving your role higher to solve this problem.`});

				if (role.position > botHighestRole.position)
					return interaction.createFollowup({content: `That role's position is higher than my highest role, ${botHighestRole.mention}. Perhaps try moving my role higher to solve this problem.`});

				try {
					const i = data.roles.indexOf(role.id);
					if (i > -1) data.roles.splice(i, 1);

					await this.bot.updateModuleData("Roles", data, guild);
					return interaction.createFollowup({content: `${this.bot.constants.emojis.tick} Removed role ${role.mention} from the roles list!`});
				} catch (e) {
					return interaction.createFollowup({content: "Error trying to add role to roles list!"});
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
					if (member.roles.length && role.position > memberHighestRole.position && !member.permissions.has("ADMINISTRATOR")) continue;
					if (role.id === guild.id) continue;
					if (role.managed) continue;

					roles.push(role);
				}

			roles = [...new Set(roles)];

			if (!roles.length)
				return interaction.createFollowup({content: "There are no roles you can get"});

			const components: MessageActionRow[] = [
				{
					type: Constants.ComponentTypes.ACTION_ROW,
					components: [
						{
							type: Constants.ComponentTypes.STRING_SELECT,
							placeholder: "Choose roles",
							customID: `roles_${interaction.member?.id}_addroles`,
							maxValues: roles.length,
							minValues: 1,
							options: roles.map((r) => ({ label: r.name, value: r.id }))
						}
					]
				}, {
					type: Constants.ComponentTypes.ACTION_ROW,
					components: [
						{
							type: Constants.ComponentTypes.BUTTON,
							style: Constants.ButtonStyles.DANGER,
							label: "Cancel",
							customID: `roles_${interaction.member?.id}_cancel`
						}
					]
				}
			];

			try {
				return interaction.createFollowup(
					{
						content: `${this.bot.constants.emojis.tick} Select the role(s) below you want to recieve.`,
						embeds: [],
						components
					}
				);
			} catch (e) {
				return interaction.createFollowup({content: "Error getting roles list."});
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
					if (member.roles.length && role.position > memberHighestRole.position && !member.permissions.has("ADMINISTRATOR")) continue;
					if (role.managed) continue;

					roles.push(role);
				}

			if (!roles.length)
				return interaction.createFollowup({content: "There are no roles you can remove"});

			const components: MessageActionRow[] = [
				{
					type: Constants.ComponentTypes.ACTION_ROW,
					components: [
						{
							type: Constants.ComponentTypes.STRING_SELECT,
							placeholder: "Choose roles",
							customID: `roles_${interaction.member?.id}_removeroles`,
							maxValues: roles.length,
							minValues: 1,
							options: roles.map((r) => ({ label: r.name, value: r.id }))
						}
					]
				}, {
					type: Constants.ComponentTypes.ACTION_ROW,
					components: [
						{
							type: Constants.ComponentTypes.BUTTON,
							style: Constants.ButtonStyles.DANGER,
							label: "Cancel",
							customID: `roles_${interaction.member?.id}_cancel`
						}
					]
				}
			];

			try {
				return interaction.createFollowup(
					{
						content: `${this.bot.constants.emojis.tick} Select the role(s) below you want to remove.`,
						embeds: [],
						components
					}
				);
			} catch (e) {
				return interaction.createFollowup({content: "Error getting roles list."});
			}
		}

		}

	}

	readonly update = async (component: ComponentInteraction): Promise<Message | void> => {

		const guild: Guild = this.bot.findGuild(component.guildID) as Guild,
			member: Member = component.member as Member;

		console.log(component);


		switch (component.data.customID.split("_")[2]) {

		case "addroles": {

			if (!(component.data as MessageComponentSelectMenuInteractionData).values.raw.length) {
				return;
			}

			const names = [],
				promises = [];
			
			let	failed = 0;

			for (const value of (component.data as MessageComponentSelectMenuInteractionData).values.raw) {
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
				await component.editOriginal(
					{
						content: `${this.bot.constants.emojis.tick} You have recieved the role(s): ${names.join(", ")}.`,
						components: []
					}
				);

				if (failed > 0) {
					component.createFollowup(
						{
							content: `There was a problem adding **${failed.toString()}** roles.`,
							flags: Constants.MessageFlags.EPHEMERAL
						}
					);
				}
				return;
			} catch (e) {
				component.editOriginal({ content: "There was an error", components: undefined });
        throw new Error("Error adding roles: " + e);
			}
		}

		case "removeroles": {
			component.deferUpdate();

			if (!(component.data as MessageComponentSelectMenuInteractionData).values.raw.length) {
				component.createFollowup({
					content: "You must select at least one role.",
				});
				return;
			}

			const names = [],
				promises = [];
			
			let	failed = 0;

			for (const value of (component.data as MessageComponentSelectMenuInteractionData).values.raw) {
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
				await component.editOriginal(
					{
						content: `${this.bot.constants.emojis.tick} The following role(s) were removed: ${names.join(", ")}.`,
						components: []
					}
				);

				if (failed > 0) {
					component.createFollowup(
						{
							content: `There was a problem removing **${failed.toString()}** roles.`,
							flags: Constants.MessageFlags.EPHEMERAL
						}
					);
				}
				return;
			} catch (e) {
				return component.editOriginal({ content: "There was an error", components: undefined });
			}
		}

		case "cancel": {
			component.deferUpdate();

			return component.editOriginal({ content: "Cancelled", components: undefined });
		}

		}

	}

}