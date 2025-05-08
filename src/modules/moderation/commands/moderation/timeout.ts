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
        content: `${this.bot.constants.emojis.x} I couldn't find you in the server!`
      });

    if (!user)
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.x} You must specify a user to timeout!`
      });

    const memberToTimeOut = this.bot.findMember(guild, user.id) as Member;

    if (!memberToTimeOut)
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.x} I couldn't find that user!`
      });

    if (!isPunishable(this.bot, moderator, memberToTimeOut)) {
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.x} I can't time that user out!`,
      });
    }
    
    let reason = interaction.data.options.getString("reason", false);
    if (!reason || reason.length < 1) reason = "No reason provided";

    let time = interaction.data.options.getString("time", false);

    if (time) time = this.bot.constants.utils.convertFromUserTime(time).toString();

    //punish user using the punish function in ../../internals/punishmentHandler.ts
    const caseData: Case = {
      id: uniqid(),
      userID: memberToTimeOut.id,
      moderatorID: moderator.id,
      action: "timeout",
      timestamp: new Date().toISOString(),
      time: time ? time : undefined
    };

    if (reason) caseData.reason = reason;

    await punish(this.bot, guild, caseData);
    await autoCalculateInfractions(this.bot, guild.id, memberToTimeOut.user);

    return interaction.createFollowup({
      content: `${this.bot.constants.emojis.tick} Placed <@${memberToTimeOut.id}> on Time Out for \`${reason}\``
    });
  }

}