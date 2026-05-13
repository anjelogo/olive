import { CommandInteraction, Constants, InteractionOptionsWrapper, ApplicationIntegrationTypes, InteractionContextTypes } from "oceanic.js";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import Voicechannel from "./voicechannel";

export default class VoicechannelContext extends Command {
  
  public type = Constants.ApplicationCommandTypes.USER;

  constructor(bot: ExtendedClient) {
    super(bot);

    this.commands = ["Set Voice Channel Owner"];
    this.permissions = ["vc.edit.owner"];
    this.integrationTypes = [ApplicationIntegrationTypes.GUILD_INSTALL];
    this.contexts = [InteractionContextTypes.GUILD];
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
  };
}