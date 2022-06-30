import { AnyInteraction, CommandInteraction, Constants } from "eris";
import Bot from "../../../main";
import { commandHandler, updateHandler } from "../internals/InteractionHandler";

export const run = async (bot: Bot, interaction: AnyInteraction): Promise<void> => {
	switch (interaction.type) {

    case Constants.InteractionTypes.APPLICATION_COMMAND: {

        await commandHandler(bot, interaction)

        break;
    }

    case Constants.InteractionTypes.MESSAGE_COMPONENT: {

        const authorID = interaction.data.custom_id.split("_")[1];

        if (authorID) {
            await updateHandler(bot, interaction, authorID);
        }
    }

    }
};