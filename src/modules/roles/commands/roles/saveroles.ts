import { CommandInteraction, Constants, Guild, Message } from "oceanic.js";
import Command from "../../../../Base/Command";
import Bot from "../../../../main";
import { moduleData } from "../../main";

export default class Saveroles extends Command {

	constructor(bot: Bot) {
		super(bot);

		this.commands = ["saveroles"];
		this.example = "saveroles";
		this.description = "Save roles of users if they leave";
		this.permissions = ["roles.save.toggle"];
	}

	readonly execute = async (interaction: CommandInteraction): Promise<Message | void> => {
		await interaction.defer(Constants.MessageFlags.EPHEMERAL);

		const guild = this.bot.findGuild(interaction.guildID) as Guild,
			data = await this.bot.getModuleData("Roles", guild) as moduleData,
			savedRoles = data.savedRoles;

		if (!savedRoles.enabled) data.savedRoles.enabled = true;
		else data.savedRoles.enabled = false;

		await this.bot.updateModuleData("Roles", data, guild);

		return interaction.createMessage({
			content: `${this.bot.constants.emojis.tick} Role Saving has been ${savedRoles.enabled ? "enabled" : "disabled"}`,
			flags: Constants.MessageFlags.EPHEMERAL
		});
	}

}