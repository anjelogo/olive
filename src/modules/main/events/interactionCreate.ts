import { AnyInteraction, Constants } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import { commandHandler, modalHandler, updateHandler } from "../internals/InteractionHandler";

export const run = async (bot: ExtendedClient, interaction: AnyInteraction): Promise<void> => {

  // IGNORE ACKNOWLEDGED INTERACTIONS
  // This breaks most commands, but it's a good practice to ignore acknowledged interactions
  // We'll edit the orginal message to prevent the bot from sending multiple messages
  if (interaction.acknowledged && interaction.createdAt.getMilliseconds() + 3000 < Date.now()) {
    switch (interaction.type) {
    case Constants.InteractionTypes.APPLICATION_COMMAND: {
      await interaction.editOriginal({ content: `${bot.constants.emojis.x} This interaction has expired`, components: [] });
      break;
    }
    case Constants.InteractionTypes.MESSAGE_COMPONENT: {
      await interaction.editOriginal({ content: `${bot.constants.emojis.x} This interaction has expired`, components: [] });
      break;
    }
    case Constants.InteractionTypes.MODAL_SUBMIT: {
      await interaction.editOriginal({ content: `${bot.constants.emojis.x} This interaction has expired`, components: [] });
      break;
    }
    default:
      return;
    }
  }

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

    break;
  }

  case Constants.InteractionTypes.MODAL_SUBMIT: {

    const authorID = interaction.data.customID.split("_")[1];

    if (authorID) {
      await modalHandler(bot, interaction, authorID);
    }

    break;
  }

  }
};