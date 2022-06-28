import { CommandInteraction, Constants, Embed, Guild, InteractionDataOptionsSubCommand, InteractionDataOptionsSubCommandGroup, Member, Message, Role } from "eris";
import Command from "../../../../Base/Command";
import Bot from "../../../../main";
import { moduleData } from "../../main";

export default class Autorole extends Command {

	constructor(bot: Bot) {

		super(bot);

		this.commands = ["autorole"];
		this.description = "Edit or view autoroles",
		this.example = "autorole list";
		this.permissions = ["roles.autorole.edit"];
		this.options = [
			{
				type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
				name: "list",
				description: "Edit the auto roles list",
				options: [
					{
						type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
						name: "add",
						description: "Add role to autoroles",
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
						description: "Remove role to autoroles",
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
				name: "view",
				description: "List roles in autoroles"
			}
		];

	}

	readonly execute = async (interaction: CommandInteraction): Promise<Message | void> => {
		await interaction.defer();

		const guild: Guild = this.bot.findGuild(interaction.guildID!!) as Guild,
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

			switch(suboption.name) {
			case "add": {
				if (data.autoRoles.includes(suboptionvalue))
					return interaction.createMessage("That role is already an Auto Role.");
		
				const role: Role = this.bot.findRole(guild, suboptionvalue) as Role;
		
				if (!role)
					return interaction.createMessage("I could not find that role");
		
				if (role.position > memberHighestRole.position && !member.permissions.has("administrator"))
					return interaction.createMessage(`That role's position is higher than your highest role, ${memberHighestRole.mention}. Perhaps try moving your role higher to solve this problem.`);
		
				if (role.position > botHighestRole.position)
					return interaction.createMessage(`That role's position is higher than my highest role, ${botHighestRole.mention}. Perhaps try moving my role higher to solve this problem.`);
		
				try {
					data.autoRoles.push(role.id);
					await this.bot.updateModuleData("Roles", data, guild);
					return interaction.createMessage(`${this.bot.constants.emojis.tick} Added role ${role.mention} to the roles list!`);
				} catch (e) {
					return interaction.createMessage("Error trying to add role to roles list!");
				}
			}
		
			case "remove": {
				const suboption = subcommand.options?.[0] as InteractionDataOptionsSubCommand,
				suboptionvalue = suboption.options?.[0].value as string;
		
				if (!data.autoRoles.includes(suboptionvalue))
					return interaction.createMessage("That role isn't in the roles list!");
		
				const role: Role = this.bot.findRole(guild, suboptionvalue) as Role;
		
				if (!role)
					return interaction.createMessage("I could not find that role");
		
				if (role.position > memberHighestRole.position)
					return interaction.createMessage(`That role's position is higher than your highest role, ${memberHighestRole.mention}. Perhaps try moving my role higher to solve this problem.`);
		
				try {
					const i = data.autoRoles.indexOf(role.id);
					if (i > -1) data.autoRoles.splice(i, 1);
		
					await this.bot.updateModuleData("Roles", data, guild);
					return interaction.createMessage(`${this.bot.constants.emojis.tick} Removed role ${role.mention} from the roles list!`);
				} catch (e) {
					return interaction.createMessage("Error trying to add role to roles list!");
				}
			}
			}

			break;
		}

		case "view": {
			const embed: Embed = {
				type: "rich",
				title: `${guild.name}'s Auto Roles`,
				description: data.autoRoles.length
					? `Users will recieve the following role(s) upon joining: \n\n${data.autoRoles.map((r) => (`<@&${r}>`)).join("\n")}`
					: `${this.bot.constants.emojis.x} Users recieve no roles upon joining.`,
				color: this.bot.constants.config.colors.default
			};

			return interaction.createMessage(
				{
					embeds: [embed]
				}
			);
		}

		}

	}

}