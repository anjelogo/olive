import { CommandInteraction, Constants } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import Starboard from "./starboard";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";

export default class StarboardContext extends Command { 
  constructor(bot: ExtendedClient) {
    super(bot);

    this.commands = ["View Stars"];
    this.permissions = ["starboard.view"];
    this.example = null;
    this.type = Constants.ApplicationCommandTypes.USER;
  }

  public execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {

    const member = interaction.data.options.resolved?.members.first();

    if (!member)
      return interaction.createFollowup({
        content: "User not found.",
        flags: Constants.MessageFlags.EPHEMERAL
      });

    const interactionData = {
      type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
      name: "view",
      options: [
        {
          type: Constants.ApplicationCommandOptionTypes.STRING,
          name: "user",
          value: member.id
        }
      ]
    };

    const mockInteraction = Object.assign({}, interaction, { data: interactionData });
    return await new Starboard(this.bot).execute(mockInteraction as unknown as CommandInteraction);
  }
}