import { CommandInteraction, Constants } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import History from "./history";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";

export default class HistoryContext extends Command {
    
  constructor(bot: ExtendedClient) {
    super(bot);

    this.commands = ["View History"];
    this.permissions = ["moderation.history.view", "moderation.history.*"];
    this.example = null;
    this.type = Constants.ApplicationCommandTypes.USER;
  }

  public execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {

    const member = interaction.data.resolved.members.first();
    if (!member) return interaction.createFollowup({content: "Member not found"});

    const interactionData = {
      name: "view",
      type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      options: [
        {
          name: "user",
          type: Constants.ApplicationCommandOptionTypes.USER,
          value: member.user.id,
        }
      ]
    };

    const mockInteraction = Object.assign({}, interaction, { data: interactionData });
    await new History(this.bot).execute(mockInteraction as CommandInteraction);
    return;
  }
}