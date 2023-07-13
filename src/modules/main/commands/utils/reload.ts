import { CommandInteraction, ComponentInteraction, Constants, Message } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";

export default class Reload extends Command {
	
	constructor(bot: ExtendedClient) {

		super(bot);

		this.disabled = false;
		this.commands = ["reload"];
		this.description = "Reload application commands";
		this.example = "eval";
		this.devOnly = true;
	
	}

	readonly execute = async (interaction: CommandInteraction): Promise<Message | void> => {
		await interaction.defer();

		return interaction.createMessage({
			embeds: [
				{
					color: 1416145,
					description: "Are you sure you want to reload the bot's application commands?",
				}
			],
			components: [
				{
					type: Constants.ComponentTypes.ACTION_ROW,
					components: [
						{
							type: Constants.ComponentTypes.BUTTON,
							style: Constants.ButtonStyles.SUCCESS,
							label: "Yes",
							customID: `reload_${interaction.member?.id}_yes`
						}, {
							type: Constants.ComponentTypes.BUTTON,
							style: Constants.ButtonStyles.DANGER,
							label: "No",
							customID: `reload_${interaction.member?.id}_no`
						}
					]
				}
			]
		});
	}

readonly update = async (component: ComponentInteraction): Promise<Message | void> => {
					
	switch (component.data.customID.split("_")[2]) {

	case "yes": {
		await component.deferUpdate();

		try {
			await this.bot.reload();

			return component.editParent({
				embeds: [
					{
						color: 1416145,
						description: "Successfully reloaded the bot's application commands.",
					}
				],
				components: []
			});
		} catch (e) {
			throw new Error(e as string);
		}
	}

	case "no": {
		await component.deferUpdate();

		return component.editParent({
			embeds: [
				{
					color: 1416145,
					description: "Cancelled request to reload bot's application commands.",
				}
			],
			components: []
		});
	}

	}

}

}