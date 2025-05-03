import { CommandInteraction, Constants, InteractionOptionsWrapper } from "oceanic.js";
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
    const member = interaction.data.resolved.members.first();
    if (!member) return await interaction.createFollowup({content: "Member not found"});

    interaction.data.options = new InteractionOptionsWrapper(
      [
        {
          type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
          name: "view",
          options: [
            {
              type: Constants.ApplicationCommandOptionTypes.USER,
              name: "user",
              value: member.id
            }
          ]
        }
      ],
      interaction.data.options.resolved
    );

    return await new Starboard(this.bot).execute(interaction);
  }
}