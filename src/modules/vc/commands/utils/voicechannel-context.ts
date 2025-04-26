import { CommandInteraction, Constants } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import Voicechannel from "./voicechannel";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";

export default class VoicechannelContext extends Command {
  
  constructor(bot: ExtendedClient) {
    super(bot);

    this.commands = ["Set Voice Channel Owner"];
    this.permissions = ["vc.edit.owner"];
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
      name: "set",
      options: [
        {
          type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
          name: "owner",
          options: [
            {
              type: Constants.ApplicationCommandOptionTypes.STRING,
              name: "name",
              value: member.id
            }
          ]
        }
      ]
    };

    const mockInteraction = Object.assign({}, interaction, { data: interactionData });
    await new Voicechannel(this.bot).execute(mockInteraction as CommandInteraction);
    return;
  }
}