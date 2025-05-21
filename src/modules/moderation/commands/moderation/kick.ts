import { CommandInteraction, Constants, Guild, Member } from "oceanic.js";
import uniqid from "uniqid";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import { autoCalculateInfractions, isPunishable, punish } from "../../internals/punishmentHandler";
import { Case } from "../../../../Database/interfaces/ModerationModuleData";

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
        content: `${this.bot.constants.emojis.x} I couldn't find you in the server!`
      });
      
    if (!user)
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.x} You must specify a user to kick!`
      });

    const memberToKick = this.bot.findMember(guild, user.id) as Member;

    if (!memberToKick)
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.x} I couldn't find that user!`
      });

    if (!isPunishable(this.bot, moderator, memberToKick)) {
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.x} I can't kick that user!`,
      });
    }
    
    let reason = interaction.data.options.getString("reason", false);
    if (!reason || reason.length < 1) reason = "No reason provided";

    //punish user using the punish function in ../../internals/punishmentHandler.ts
    const caseData: Case = {
      id: uniqid(),
      userID: memberToKick.id,
      moderatorID: moderator.id,
      action: "kick",
      timestamp: new Date().toISOString()
    };

    if (reason) caseData.reason = reason;

    await punish(this.bot, guild, caseData);
    await autoCalculateInfractions(this.bot, guild.id, memberToKick.user);

    return interaction.createFollowup({
      content: `${this.bot.constants.emojis.tick} Kicked <@${memberToKick.id}> for \`${reason}\``
    });
  }

}