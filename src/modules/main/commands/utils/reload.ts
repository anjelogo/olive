import { CommandInteraction, ComponentInteraction, Constants, Message } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";

export default class Reload extends Command {
  
  constructor(bot: ExtendedClient) {

    super(bot);

    this.disabled = false;
    this.commands = ["reload"];
    this.description = "Reload application commands";
    this.example = "eval";
    this.devOnly = true;
  
  }

  readonly execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {
    return interaction.createFollowup({
      components: [
        {
          type: Constants.ComponentTypes.CONTAINER,
          components: [{
            type: Constants.ComponentTypes.TEXT_DISPLAY,
            content: "## Are you sure you want to reload the bot's application commands?",
          }, {
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
          }]
        }
      ],
      flags: Constants.MessageFlags.IS_COMPONENTS_V2
    });
  }

readonly update = async (component: ComponentInteraction): Promise<Message | void> => {
          
  switch (component.data.customID.split("_")[2]) {

  case "yes": {
    try {
      await this.bot.reload();

      return component.editOriginal({
        components: [
          {
            type: Constants.ComponentTypes.CONTAINER,
            components: [{
              type: Constants.ComponentTypes.TEXT_DISPLAY,
              content: "## Successfully reloaded the bot's application commands.",
            }]
          }
        ]
      });
    } catch (e) {
      throw new Error(e as string);
    }
  }

  case "no": {
    return component.editOriginal({
      components: [
        {
          type: Constants.ComponentTypes.CONTAINER,
          components: [{
            type: Constants.ComponentTypes.TEXT_DISPLAY,
            content: "## Cancelled reloading the bot's application commands.",
          }]
        }
      ]
    });
  }

  }

}

}