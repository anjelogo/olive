import { CommandInteraction, Message } from "oceanic.js";
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
		await interaction.defer();
		
		return interaction.createFollowup({
			content: "Pong 🏓",
			embeds: [
				{
					color: this.bot.constants.config.colors.default,
					description: `**Response Time:** \`${Date.now() - interaction.createdAt.getTime()}\`ms`,
				}
			]
		});
	}

}