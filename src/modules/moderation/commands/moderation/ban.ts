import { CommandInteraction, Constants, Guild, Member } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import { autoCalculateInfractions, isPunishable, punish } from "../../internals/punishmentHandler";
import uniqid from "uniqid";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";
import { Case } from "../../../../Database/interfaces/ModerationModuleData";

export default class Ban extends Command {

  constructor(bot: ExtendedClient) {

    super(bot);

    this.commands = ["ban"];
    this.example = "ban @user being very mean 10d";
    this.description = "Bans a user from the server";
    this.permissions = ["moderation.punish.ban", "moderation.punish.*"];
    this.options = [
      {
        name: "user",
        description: "The user to ban",
        required: true,
        type: Constants.ApplicationCommandOptionTypes.USER,
      }, {
        name: "reason",
        description: "The reason for the ban",
        required: false,
        type: Constants.ApplicationCommandOptionTypes.STRING,
      }, {
        name: "time",
        description: "The time to ban the user for",
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
        content: `${this.bot.constants.emojis.x} You must specify a user to ban!`
      });

    const memberToBan = this.bot.findMember(guild, user.id) as Member;

    if (!memberToBan)
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.x} I couldn't find that user!`
      });

    if (!isPunishable(this.bot, moderator, memberToBan)) {
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.x} I can't ban that user!`,
      });
    }
    
    let reason = interaction.data.options.getString("reason", false);
    if (!reason || reason.length < 1) reason = "No reason provided";

    const time = interaction.data.options.getString("time", false);

    //punish user using the punish function in ../../internals/punishmentHandler.ts
    const caseData: Case = {
      id: uniqid(),
      userID: memberToBan.id,
      moderatorID: moderator.id,
      action: "ban",
      timestamp: new Date().toISOString(),
      time: time ? time : undefined,
    };

    if (reason) caseData.reason = reason;

    await punish(this.bot, guild, caseData);
    await autoCalculateInfractions(this.bot, guild.id, memberToBan.user);

    return interaction.createFollowup({
      content: `${this.bot.constants.emojis.tick} Banned <@${memberToBan.username}> for \`${reason}\``
    });
  }

}