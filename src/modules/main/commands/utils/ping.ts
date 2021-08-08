import ApplicationCommandManager from "../../../../Base/Application/ApplicationCommandManager";
import FollowupManager from "../../../../Base/Application/FollowupManager";
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

	readonly execute = async (interaction: ApplicationCommandManager): Promise<ApplicationCommandManager | FollowupManager> => {
		const m: ApplicationCommandManager | FollowupManager = await interaction.defer();
		
		return m.edit({
			content: "Pong 🏓",
			embeds: [
				{
					color: this.bot.constants.config.colors.default,
					description: "**Response Time:** `placeholder ms`",
					type: "rich"
				}
			]
		});
	}

}