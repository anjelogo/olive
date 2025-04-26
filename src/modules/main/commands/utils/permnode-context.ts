import { CommandInteraction, Constants, InteractionOptionsWrapper } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import Permnode from "./permnode";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";

export default class PermnodeContext extends Command {
  
  constructor(bot: ExtendedClient) {
    super(bot);

    this.commands = ["View User's Permission nodes"];
    this.permissions = ["main.permnode.view"];
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
              type: Constants.ApplicationCommandOptionTypes.MENTIONABLE,
              name: "entity",
              value: member.id
            }
          ]
        }
      ],
      interaction.data.options.resolved
    );

    await new Permnode(this.bot).execute(interaction);
    return;
  }
}
