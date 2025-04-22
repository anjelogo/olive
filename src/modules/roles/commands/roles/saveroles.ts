import { CommandInteraction, Constants, Guild, Message } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import { moduleData } from "../../main";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";

export default class Saveroles extends Command {

	constructor(bot: ExtendedClient) {
		super(bot);

		this.commands = ["saveroles"];
		this.example = "saveroles";
		this.description = "Save roles of users if they leave";
		this.permissions = ["roles.save.toggle"];
	}

	readonly execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {
		await interaction.defer(Constants.MessageFlags.EPHEMERAL);

		const guild = this.bot.findGuild(interaction.guildID) as Guild,
			data = await this.bot.getModuleData("Roles", guild.id) as moduleData,
			savedRoles = data.savedRoles;

		if (!savedRoles.enabled) data.savedRoles.enabled = true;
		else data.savedRoles.enabled = false;

		await this.bot.updateModuleData("Roles", data, guild);

		return interaction.createFollowup({
			content: `${this.bot.constants.emojis.tick} Role Saving has been ${savedRoles.enabled ? "enabled" : "disabled"}`,
			flags: Constants.MessageFlags.EPHEMERAL
		});
	}

}