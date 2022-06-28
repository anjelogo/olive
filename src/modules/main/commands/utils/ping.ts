import { CommandInteraction, Message } from "eris";
import Command from "../../../../Base/Command";
import Bot from "../../../../main";

export default class Ping extends Command {
	
	constructor(bot: Bot) {

		super(bot);

		this.commands = ["ping"];
		this.description = "Get Discord/Bot Latency";
		this.example = "ping";
		this.permissions = ["main.ping"];
	
	}

	readonly execute = async (interaction: CommandInteraction): Promise<Message | void> => {
		await interaction.defer()
		
		return interaction.createMessage({
			content: "Pong 🏓",
			embeds: [
				{
					color: this.bot.constants.config.colors.default,
					description: "**Response Time:** `placeholder ms`",
				}
			]
		});
	}

}