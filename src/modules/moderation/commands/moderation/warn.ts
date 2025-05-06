import { CommandInteraction, Constants, Guild, Member } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import { autoCalculateInfractions, isPunishable, punish } from "../../internals/punishmentHandler";
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
      user = interaction.data.options.getUser("user", true);

    if (!moderator)
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.x} You must specify a user to warn!`
      });

    if (!user)
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.x} You must specify a user to warn!`
      });

    const memberToWarn = this.bot.findMember(guild, user.id) as Member;

    if (!memberToWarn)
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.x} I couldn't find that user!`
      });

    if (!isPunishable(this.bot, moderator, memberToWarn)) {
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.x} I can't warn that user!`,
      });
    }
    
    let reason = interaction.data.options.getString("reason", false);
    if (!reason || reason.length < 1) reason = "No reason provided";

    //punish user using the punish function in ../../internals/punishmentHandler.ts
    const caseData: Case = {
      id: uniqid(),
      userID: memberToWarn.id,
      moderatorID: moderator.id,
      action: "warn",
      timestamp: new Date().toISOString()
    };

    if (reason) caseData.reason = reason;

    await punish(this.bot, guild, caseData);
    await autoCalculateInfractions(this.bot, guild.id, memberToWarn.user);

    return interaction.createFollowup({
      content: `${this.bot.constants.emojis.tick} Warned <@${memberToWarn.id}> for \`${reason}\``
    });
  }

}