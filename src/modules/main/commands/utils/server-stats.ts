import { CommandInteraction, Constants, ApplicationIntegrationTypes, InteractionContextTypes } from "oceanic.js";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";

export default class ServerStats extends Command {

  public type = Constants.ApplicationCommandTypes.CHAT_INPUT;

  constructor(bot: ExtendedClient) {

    super(bot);

    this.commands = ["server-stats"];
    this.description = "View stats about this server.";
    this.example = "server-stats";
    this.permissions = ["main.server-stats"];
    this.tags = ["information"];
    this.integrationTypes = [ApplicationIntegrationTypes.GUILD_INSTALL];
    this.contexts = [InteractionContextTypes.GUILD];

  }

  readonly execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {
    const guild = this.bot.findGuild(interaction.guildID);

    if (!guild) return interaction.createFollowup({ content: `${this.bot.constants.emojis.x} Could not find this server.` });

    const owner = guild.ownerID ? this.bot.users.get(guild.ownerID) : null;

    return interaction.createFollowup({
      components: [
        {
          type: Constants.ComponentTypes.CONTAINER,
          components: [
            {
              type: Constants.ComponentTypes.TEXT_DISPLAY,
              content: `## ${guild.name}`,
            },
            {
              type: Constants.ComponentTypes.TEXT_DISPLAY,
              content: [
                `**Owner:** ${owner ? `${owner.username} (\`${owner.id}\`)` : `\`${guild.ownerID}\``}`,
                `**Members:** ${guild.memberCount}`,
                `**Boost Tier:** ${guild.premiumTier}`,
                `**Created:** <t:${Math.floor(guild.createdAt.getTime() / 1000)}:D>`,
              ].join("\n"),
            },
          ],
        },
      ],
      flags: Constants.MessageFlags.IS_COMPONENTS_V2,
    });
  };

}
