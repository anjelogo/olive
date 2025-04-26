import { CommandInteraction, Constants, Guild, Member,  TextChannel } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import { moduleData} from "../../main";
import { moduleData as LoggingModuleData } from "../../../logging/main";
import { removeCase, resolveCase } from "../../internals/caseHandler";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";

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
      data = await this.bot.getModuleData("Moderation", guild.id) as moduleData,
      subcommand = interaction.data.options.getSubCommand(true)[0];

    const caseID = interaction.data.options.getString("case", true),
      Case = data.cases.find((c) => c.id === caseID);

    if (!Case)
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.x} I could not find that case.`,
        flags: Constants.MessageFlags.EPHEMERAL
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
            content: `${this.bot.constants.emojis.x} I could not find that case.`,
            flags: Constants.MessageFlags.EPHEMERAL
          });

        const logMessage = this.bot.findMessage(this.bot.getChannel(logCase.channelID) as TextChannel, logCase.messageID);

        if (!logMessage)
          return interaction.createFollowup({
            content: `${this.bot.constants.emojis.x} I could not find that case.`,
            flags: Constants.MessageFlags.EPHEMERAL
          });

        return interaction.createFollowup({
          embeds: [logMessage.embeds[0]],
          flags: Constants.MessageFlags.EPHEMERAL
        });

      }

      break;
    }

    case "resolve": {
      if (Case.resolved)
        return interaction.createFollowup({
          content: `${this.bot.constants.emojis.x} That case has already been resolved.`,
          flags: Constants.MessageFlags.EPHEMERAL
        });

      let reason = interaction.data.options.getString("reason", false);
      if (!reason) reason = Case.reason;

      await resolveCase(this.bot, guild, Case.id, member.id, reason as string);
      
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.check} Case \`${Case.id}\` has been resolved.`,
        flags: Constants.MessageFlags.EPHEMERAL
      });
    }

    case "delete": {
      await removeCase(this.bot, guild, Case.id);

      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.check} Case \`${Case.id}\` has been deleted.`,
        flags: Constants.MessageFlags.EPHEMERAL
      });
    }

    }

  }

}