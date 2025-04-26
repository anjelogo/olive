import { CommandInteraction, Constants, InteractionOptionsWrapper } from "oceanic.js";
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
    const member = interaction.data.resolved.members.first();
    if (!member) return await interaction.createFollowup({content: "Member not found"});

    interaction.data.options = new InteractionOptionsWrapper(
      [
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
      ],
      interaction.data.options.resolved
    );

    await new Voicechannel(this.bot).execute(interaction);
    return;
  }
}