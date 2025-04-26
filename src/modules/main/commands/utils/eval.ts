import { CommandInteraction, Constants } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";

export default class Eval extends Command {
  
  constructor(bot: ExtendedClient) {

    super(bot);

    this.disabled = false;
    this.commands = ["eval"];
    this.example = "eval 2+2";
    this.devOnly = true;
    this.options = [
      {
        name: "expression",
        type: Constants.ApplicationCommandOptionTypes.STRING,
        description: "The expression you want to be evaluated",
        required: true
      }
    ];
  
  }

  readonly execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {

    const code = (interaction.data.options.getStringOption("expression", true)).value as string;


    try {
      const evaled = await eval(code);

      /* const MAX_CHARS = 3 + 2 + evaled.toString().length + 3;

      if (MAX_CHARS > 4000) {
        interaction.reply("Output exceeded 4000 characters");
      } */

      return interaction.createFollowup({
        components: [
          {
            type: Constants.ComponentTypes.CONTAINER,
            components: [
              {
                type: Constants.ComponentTypes.TEXT_DISPLAY,
                content: `# Evaluation Successful!\n## Type: ${typeof (evaled)}`,
              }, {
                type: Constants.ComponentTypes.TEXT_DISPLAY,
                content: `## 📥 Input:\n\`${code}\``,
              }, {
                type: Constants.ComponentTypes.SEPARATOR,
              }, {
                type: Constants.ComponentTypes.TEXT_DISPLAY,
                content: `## 📤 Output:\n\`${evaled}\``,
              }
            ]
          }
        ],
        flags: Constants.MessageFlags.IS_COMPONENTS_V2
      });
    } catch (e) {
      return interaction.createFollowup({
        components: [
          {
            type: Constants.ComponentTypes.CONTAINER,
            components: [
              {
                type: Constants.ComponentTypes.TEXT_DISPLAY,
                content: "# Evaluation Failed!",
              }, {
                type: Constants.ComponentTypes.TEXT_DISPLAY,
                content: `## 📥 Input:\n\`${code}\``,
              }, {
                type: Constants.ComponentTypes.SEPARATOR,
              }, {
                type: Constants.ComponentTypes.TEXT_DISPLAY,
                content: `## 📤 Error:\n\`${e}\``,
              }
            ]
          }
        ],
        flags: Constants.MessageFlags.IS_COMPONENTS_V2
      });
    }
  }

}