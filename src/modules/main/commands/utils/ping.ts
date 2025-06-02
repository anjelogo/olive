import { CommandInteraction, Constants } from "oceanic.js";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";

export default class Ping extends Command {
  
  constructor(bot: ExtendedClient) {

    super(bot);

    this.commands = ["ping"];
    this.description = "Check the bot's latency against Discord's API.";
    this.type = Constants.ApplicationCommandTypes.CHAT_INPUT;
    this.example = "ping";
    this.permissions = ["main.ping"];
    this.tags = ["information"];
  
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
  }

}