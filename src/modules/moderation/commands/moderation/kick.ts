import { CommandInteraction, Constants, Guild, Member, Message, Role } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import { autoCalculateInfractions, isPunishable, punish } from "../../internals/punishmentHandler";
import uniqid from "uniqid";
import { Case } from "../../main";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";

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

	readonly execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {
		const guild = this.bot.findGuild(interaction.guildID) as Guild,
			moderator = interaction.member,
			user = interaction.data.options.getUser("user", true);

		if (!moderator)
			return interaction.createFollowup({
				content: `${this.bot.constants.emojis.x} I couldn't find you in the server!`,
				flags: Constants.MessageFlags.EPHEMERAL
			});
			
		if (!user)
			return interaction.createFollowup({
				content: `${this.bot.constants.emojis.x} You must specify a user to kick!`,
				flags: Constants.MessageFlags.EPHEMERAL
			});

		const userToKick = this.bot.findMember(guild, user.id) as Member;

		if (!userToKick)
			return interaction.createFollowup({
				content: `${this.bot.constants.emojis.x} I couldn't find that user!`,
				flags: Constants.MessageFlags.EPHEMERAL
			});

    if (!isPunishable(this.bot, moderator, userToKick)) {
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.x} I can't kick that user!`,
      });
    }
		
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