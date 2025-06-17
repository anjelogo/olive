import { CommandInteraction, Constants, InteractionOptionsWrapper } from "oceanic.js";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import History from "./history";

export default class HistoryContext extends Command {
    
  public type = Constants.ApplicationCommandTypes.USER;

  constructor(bot: ExtendedClient) {
    super(bot);

    this.commands = ["View History"];
    this.permissions = ["moderation.history.view", "moderation.history.*"];
    this.example = null;
  }

  public execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {
    const member = interaction.data.resolved.members.first();
    if (!member) return interaction.createFollowup({content: `${this.bot.constants.emojis.x} Member not found`});

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

    await new History(this.bot).execute(interaction);
    return;
  };
}