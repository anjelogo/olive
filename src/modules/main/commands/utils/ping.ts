import { CommandInteraction, Constants, ApplicationIntegrationTypes, InteractionContextTypes } from "oceanic.js";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";

export default class Ping extends Command {
  
  public type = Constants.ApplicationCommandTypes.CHAT_INPUT;

  constructor(bot: ExtendedClient) {

    super(bot);

    this.commands = ["ping"];
    this.description = "Check the bot's latency against Discord's API.";
    this.example = "ping";
    this.permissions = ["main.ping"];
    this.tags = ["information"];
    this.integrationTypes = [ApplicationIntegrationTypes.GUILD_INSTALL, ApplicationIntegrationTypes.USER_INSTALL];
    this.contexts = [InteractionContextTypes.GUILD, InteractionContextTypes.BOT_DM, InteractionContextTypes.PRIVATE_CHANNEL];
  
  }

  readonly execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {
    
    return interaction.createFollowup({
      components:[
        {type: Constants.ComponentTypes.CONTAINER,
          components: [
            {
              type: Constants.ComponentTypes.TEXT_DISPLAY,
              content: `## Pong! 🏓\n Latency: \`${Date.now() - interaction.createdAt.getTime()}ms\``,
            }
          ]}
      ],
      flags: Constants.MessageFlags.IS_COMPONENTS_V2
    });
  };

}