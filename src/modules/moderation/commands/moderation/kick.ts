import { CommandInteraction, Constants, Guild, Member, Message, Role } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import { autoCalculateInfractions, punish } from "../../internals/punishmentHandler";
import uniqid from "uniqid";
import { Case } from "../../main";

export default class Kick extends Command {

	constructor(bot: ExtendedClient) {

		super(bot);

		this.commands = ["kick"];
		this.example = "kick @user being very mean";
		this.description = "Kicks a user from the server";
		this.permissions = ["moderation.punish.kick", "moderation.punish.*"];
		this.options = [
			{
				name: "user",
				description: "The user to kick",
				required: true,
				type: Constants.ApplicationCommandOptionTypes.USER,
			}, {
				name: "reason",
				description: "The reason for the kick",
				required: false,
				type: Constants.ApplicationCommandOptionTypes.STRING,
			}
		];

	}

	readonly execute = async (interaction: CommandInteraction): Promise<Message | void> => {
		await interaction.defer(Constants.MessageFlags.EPHEMERAL);

		const guild = this.bot.findGuild(interaction.guildID) as Guild,
			moderator = interaction.member,
			memberString = interaction.data.options.getString("user", true);

		if (!moderator)
			return interaction.createFollowup({
				content: `${this.bot.constants.emojis.x} I couldn't find you in the server!`,
				flags: Constants.MessageFlags.EPHEMERAL
			});
			
		if (!memberString)
			return interaction.createFollowup({
				content: `${this.bot.constants.emojis.x} You must specify a user to kick!`,
				flags: Constants.MessageFlags.EPHEMERAL
			});

		const userToKick = this.bot.findMember(guild, memberString) as Member;

		if (!userToKick)
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
			userToKickHighestRoleID = userToKick.roles.length
				? userToKick.roles
					.map((r) => 
						({
							name: (this.bot.findRole(guild, r) as Role).name,
							position: (this.bot.findRole(guild, r) as Role).position
						}))
					.sort((a, b) => b.position - a.position).map((r) => r.name)
				: [guild.id],
			userToKickHighestRole = this.bot.findRole(guild, userToKickHighestRoleID[0]) as Role;

		if (userToKick.id === moderator.id)
			return interaction.createFollowup({
				content: `${this.bot.constants.emojis.x} You can't kick yourself!`,
				flags: Constants.MessageFlags.EPHEMERAL
			});
		if (userToKick.id === guild.ownerID)
			return interaction.createFollowup({
				content: `${this.bot.constants.emojis.x} You can't kick the server owner!`,
				flags: Constants.MessageFlags.EPHEMERAL
			});
		if (userToKickHighestRole.position > memberHighestRole.position)
			return interaction.createFollowup({
				content: `${this.bot.constants.emojis.x} You can't kick a user with a higher role than you!`,
				flags: Constants.MessageFlags.EPHEMERAL
			});
    if (userToKick.id === this.bot.user.id)
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.x} You can't kick the bot!`,
        flags: Constants.MessageFlags.EPHEMERAL
      });
		if (userToKickHighestRole.position > botHighestRole.position)
			return interaction.createFollowup({
				content: `${this.bot.constants.emojis.x} User has a role higher than the bot!`,
				flags: Constants.MessageFlags.EPHEMERAL
			});
		if (userToKickHighestRole.position === botHighestRole.position)
			return interaction.createFollowup({
				content: `${this.bot.constants.emojis.x} User has the same role as the bot!`,
				flags: Constants.MessageFlags.EPHEMERAL
			});
		
		let reason = interaction.data.options.getString("reason", false);
		if (!reason || reason.length < 1) reason = "No reason provided";

		//punish user using the punish function in ../../internals/punishmentHandler.ts
		const caseData: Case = {
			id: uniqid(),
			userID: userToKick.id,
			moderatorID: moderator.id,
			action: "kick",
			timestamp: new Date().toISOString()
		};

		if (reason) caseData.reason = reason;

		await punish(this.bot, guild, caseData);
		await autoCalculateInfractions(this.bot, userToKick);

		return interaction.createFollowup({
			content: `${this.bot.constants.emojis.check} Kicked \`${userToKick.username}#${userToKick.discriminator}\` for \`${reason}\``,
			flags: Constants.MessageFlags.EPHEMERAL
		});
	}

}