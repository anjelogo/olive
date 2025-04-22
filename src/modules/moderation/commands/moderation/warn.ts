import { CommandInteraction, Constants, Guild, Member, Message, Role } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import { autoCalculateInfractions, punish } from "../../internals/punishmentHandler";
import uniqid from "uniqid";
import { Case } from "../../main";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";

export default class Warn extends Command {

	constructor(bot: ExtendedClient) {

		super(bot);

		this.commands = ["warn"];
		this.example = "warn @user being very mean";
		this.description = "warns a user from the server";
		this.permissions = ["moderation.punish.warn", "moderation.punish.*"];
		this.options = [
			{
				name: "user",
				description: "The user to warn",
				required: true,
				type: Constants.ApplicationCommandOptionTypes.USER,
			}, {
				name: "reason",
				description: "The reason for the warn",
				required: false,
				type: Constants.ApplicationCommandOptionTypes.STRING,
			}
		];

	}

	readonly execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {
		const guild = this.bot.findGuild(interaction.guildID) as Guild,
			moderator = interaction.member,
			memberString = interaction.data.options.getString("user", true);

		if (!moderator)
			return interaction.createFollowup({
				content: `${this.bot.constants.emojis.x} You must specify a user to warn!`,
				flags: Constants.MessageFlags.EPHEMERAL
			});

		if (!memberString)
			return interaction.createFollowup({
				content: `${this.bot.constants.emojis.x} You must specify a user to warn!`,
				flags: Constants.MessageFlags.EPHEMERAL
			});

		const userToWarn = this.bot.findMember(guild, memberString) as Member;

		if (!userToWarn)
			return interaction.createFollowup({
				content: `${this.bot.constants.emojis.x} I couldn't find that user!`,
				flags: Constants.MessageFlags.EPHEMERAL
			});

		const botMember = this.bot.findMember(guild, this.bot.user.id) as Member,
			botHighestRoleID = botMember.roles
				.map((r) => 
					({
						name: (this.bot.findRole(guild, r) as Role).name,
						position: (this.bot.findRole(guild, r) as Role).position
					}))
				.sort((a, b) => b.position - a.position).map((r) => r.name),
			botHighestRole = this.bot.findRole(guild, botHighestRoleID[0]) as Role,
			memberHighestRoleID = moderator.roles.length
				? moderator.roles
					.map((r) => 
						({
							name: (this.bot.findRole(guild, r) as Role).name,
							position: (this.bot.findRole(guild, r) as Role).position
						}))
					.sort((a, b) => b.position - a.position).map((r) => r.name)
				: [guild.id],
			memberHighestRole = this.bot.findRole(guild, memberHighestRoleID[0]) as Role,
			userToWarnHighestRoleID = userToWarn.roles.length
				? userToWarn.roles
					.map((r) => 
						({
							name: (this.bot.findRole(guild, r) as Role).name,
							position: (this.bot.findRole(guild, r) as Role).position
						}))
					.sort((a, b) => b.position - a.position).map((r) => r.name)
				: [guild.id],
			userToWarnHighestRole = this.bot.findRole(guild, userToWarnHighestRoleID[0]) as Role;

		if (userToWarn.id === moderator.id)
			return interaction.createFollowup({
				content: `${this.bot.constants.emojis.x} You can't warn yourself!`,
				flags: Constants.MessageFlags.EPHEMERAL
			});
		if (userToWarn.id === guild.ownerID)
			return interaction.createFollowup({
				content: `${this.bot.constants.emojis.x} You can't warn the server owner!`,
				flags: Constants.MessageFlags.EPHEMERAL
			});
		if (userToWarnHighestRole.position > memberHighestRole.position)
			return interaction.createFollowup({
				content: `${this.bot.constants.emojis.x} You can't warn a user with a higher role than you!`,
				flags: Constants.MessageFlags.EPHEMERAL
			});
    if (userToWarnHighestRole.position === memberHighestRole.position)
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.x} You can't warn a user with the same role as you!`,
        flags: Constants.MessageFlags.EPHEMERAL
      });
		if (userToWarnHighestRole.position > botHighestRole.position)
			return interaction.createFollowup({
				content: `${this.bot.constants.emojis.x} User has a role higher than the bot!`,
				flags: Constants.MessageFlags.EPHEMERAL
			});
		if (userToWarnHighestRole.position === botHighestRole.position)
			return interaction.createFollowup({
				content: `${this.bot.constants.emojis.x} User has the same role as the bot!`,
				flags: Constants.MessageFlags.EPHEMERAL
			});
		
		let reason = interaction.data.options.getString("reason", false);
		if (!reason || reason.length < 1) reason = "No reason provided";

		//punish user using the punish function in ../../internals/punishmentHandler.ts
		const caseData: Case = {
			id: uniqid(),
			userID: userToWarn.id,
			moderatorID: moderator.id,
			action: "warn",
			timestamp: new Date().toISOString()
		};

		if (reason) caseData.reason = reason;

		await punish(this.bot, guild, caseData);
		await autoCalculateInfractions(this.bot, userToWarn);

		return interaction.createFollowup({
			content: `${this.bot.constants.emojis.check} Warned \`${userToWarn.username}#${userToWarn.discriminator}\` for \`${reason}\``,
			flags: Constants.MessageFlags.EPHEMERAL
		});
	}

}