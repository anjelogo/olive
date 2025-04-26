import { CommandInteraction, Constants, Guild, Member } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import { autoCalculateInfractions, isPunishable, punish } from "../../internals/punishmentHandler";
import uniqid from "uniqid";
import { Case } from "../../main";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";

export default class Timeout extends Command {

  constructor(bot: ExtendedClient) {

    super(bot);

    this.commands = ["timeout"];
    this.example = "timeout @user being very mean";
    this.description = "Puts the user on Time out";
    this.permissions = ["moderation.punish.timeout", "moderation.punish.*"];
    this.options = [
      {
        name: "user",
        description: "The user to timeout",
        required: true,
        type: Constants.ApplicationCommandOptionTypes.USER,
      }, {
        name: "reason",
        description: "The reason for the timeout",
        required: false,
        type: Constants.ApplicationCommandOptionTypes.STRING,
      }, {
        name: "time",
        description: "The duration of the timeout",
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
        content: `${this.bot.constants.emojis.x} You must specify a user to timeout!`,
        flags: Constants.MessageFlags.EPHEMERAL
      });

    const userToTimeOut = this.bot.findMember(guild, user.id) as Member;

    if (!userToTimeOut)
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.x} I couldn't find that user!`,
        flags: Constants.MessageFlags.EPHEMERAL
      });

    if (!isPunishable(this.bot, moderator, userToTimeOut)) {
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.x} I can't time that user out!`,
      });
    }
    
    let reason = interaction.data.options.getString("reason", false);
    if (!reason || reason.length < 1) reason = "No reason provided";

    let time = interaction.data.options.getString("time", false);

    if (time) time = this.bot.constants.utils.convertFromUserTime(time);

    //punish user using the punish function in ../../internals/punishmentHandler.ts
    const caseData: Case = {
      id: uniqid(),
      userID: userToTimeOut.id,
      moderatorID: moderator.id,
      action: "timeout",
      timestamp: new Date().toISOString(),
      time: time ? time : undefined
    };

    if (reason) caseData.reason = reason;

    await punish(this.bot, guild, caseData);
    await autoCalculateInfractions(this.bot, userToTimeOut);

    return interaction.createFollowup({
      content: `${this.bot.constants.emojis.check} Placed \`${userToTimeOut.username}#${userToTimeOut.discriminator}\` on Time Out for \`${reason}\``
    });
  }

}