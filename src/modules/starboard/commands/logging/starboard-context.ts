import { CommandInteraction, Constants, InteractionOptionsWrapper } from "oceanic.js";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import Starboard from "./starboard";

export default class StarboardContext extends Command {
  
  public type = Constants.ApplicationCommandTypes.USER;

  constructor(bot: ExtendedClient) {
    super(bot);

    this.commands = ["View Stars"];
    this.permissions = ["starboard.view"];
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
  };
}