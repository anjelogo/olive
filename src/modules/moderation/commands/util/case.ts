import { CommandInteraction, Constants, Guild, Member,  TextChannel } from "oceanic.js";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import { removeCase, resolveCase } from "../../internals/caseHandler";
import { ModerationModuleData } from "../../../../Database/interfaces/ModerationModuleData";
import { LoggingModuleData } from "../../../../Database/interfaces/LoggingModuleData";

export default class Case extends Command {

  constructor (bot: ExtendedClient) {

    super(bot);

    this.commands = ["case"];
    this.description = "Interact with the moderation cases of a user";
    this.example = "case get 123";
    this.permissions = ["moderation.case.*"];
    this.options = [
      {
        name: "view",
        description: "View the moderation case of a user",
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        permissions: ["moderation.case.view"],
        options: [
          {
            name: "case",
            description: "The case ID of the case to view",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: true
          }
        ]
      }, {
        name: "resolve",
        description: "Resolve a moderation case",
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        permissions: ["moderation.case.resolve"],
        options: [
          {
            name: "case",
            description: "The case ID of the case to resolve",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: true
          }, {
            name: "reason",
            description: "The reason for resolving the case",
            type: Constants.ApplicationCommandOptionTypes.STRING,
          }
        ]
      }, {
        name: "delete",
        description: "Delete a moderation case",
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        permissions: ["moderation.case.delete"],
        options: [
          {
            name: "case",
            description: "The case ID of the case to delete",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: true
          }
        ]
      }
    ];

  }

  readonly execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {
    const member = interaction.member as Member,
      guild = this.bot.findGuild(interaction.guildID) as Guild,
      data = await this.bot.getModuleData("Moderation", guild.id) as ModerationModuleData,
      subcommand = interaction.data.options.getSubCommand(true)[0];

    const caseID = interaction.data.options.getString("case", true),
      Case = data.cases.find((c) => c.id === caseID);

    if (!Case)
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.x} I could not find that case.`
      });

    switch (subcommand) {
    case "view": {
      const guildData = await this.bot.getModuleData("Logging", guild.id) as LoggingModuleData;

      if (guildData.channels.filter((c) => c.types.includes("moderation")).length) {
        const moderationLogChannels = guildData.channels.filter((c) => c.types.includes("moderation") && c.cases);

        if (!moderationLogChannels.length) return;

        const channelsWithCases = moderationLogChannels.filter((c) => c.cases && c.cases.find((caseItem) => caseItem.caseID === Case.id));

        if (!channelsWithCases) return;

        const logCase = channelsWithCases.map((c) => c.cases && c.cases.find((c) => c.caseID === Case.id))[0];

        if (!logCase)
          return interaction.createFollowup({
            content: `${this.bot.constants.emojis.x} I could not find that case.`
          });

        const logChannel = this.bot.getChannel(logCase.channelID) as TextChannel;
        if (!logChannel)
          return interaction.createFollowup({
            content: `${this.bot.constants.emojis.x} I could not find that channel.`
          });

        const logMessage = await logChannel.getMessage(logCase.messageID);

        if (!logMessage)
          return interaction.createFollowup({
            content: `${this.bot.constants.emojis.x} I could not find that message.`
          });

        if (!logMessage)
          return interaction.createFollowup({
            content: `${this.bot.constants.emojis.x} I could not find that case.`
          });

        return interaction.createFollowup({
          components: logMessage.components,
          flags: Constants.MessageFlags.IS_COMPONENTS_V2
        });

      }

      break;
    }

    case "resolve": {
      if (Case.resolved)
        return interaction.createFollowup({
          content: `${this.bot.constants.emojis.x} That case has already been resolved.`
        });

      let reason = interaction.data.options.getString("reason", false);
      if (!reason) reason = "No resolve reason provided";

      await resolveCase(this.bot, guild, Case.id, member.id, reason as string);
      
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.tick} Case \`${Case.id}\` has been resolved.`
      });
    }

    case "delete": {
      await removeCase(this.bot, guild, Case.id);

      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.tick} Case \`${Case.id}\` has been deleted.`
      });
    }

    }

  }

}