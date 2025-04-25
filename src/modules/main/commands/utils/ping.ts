import { CommandInteraction, Constants, Message } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";

export default class Ping extends Command {
	
	constructor(bot: ExtendedClient) {

		super(bot);

		this.commands = ["ping"];
		this.description = "Get Discord/Bot Latency";
		this.example = "ping";
		this.permissions = ["main.ping"];
	
	}

	readonly execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {
		
		return interaction.createFollowup({
			components:[
        {type: Constants.ComponentTypes.CONTAINER,
        components: [
          {
            type: Constants.ComponentTypes.TEXT_DISPLAY,
            content: `# Pong! 🏓\n Latency: \`${Date.now() - interaction.createdAt.getTime()}ms\``,
          }
        ]}
      ],
      flags: Constants.MessageFlags.IS_COMPONENTS_V2
		});
	}

}