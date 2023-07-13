import { AnyInteraction, Constants } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import { commandHandler, updateHandler } from "../internals/InteractionHandler";

export const run = async (bot: ExtendedClient, interaction: AnyInteraction): Promise<void> => {
	switch (interaction.type) {

	case Constants.InteractionTypes.APPLICATION_COMMAND: {

		await commandHandler(bot, interaction);

		break;
	}

	case Constants.InteractionTypes.MESSAGE_COMPONENT: {

		const authorID = interaction.data.customID.split("_")[1];

		if (authorID) {
			await updateHandler(bot, interaction, authorID);
		}
	}

	}
};