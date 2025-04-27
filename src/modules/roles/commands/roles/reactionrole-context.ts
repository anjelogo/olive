import { CommandInteraction, Constants, InteractionOptionsWrapper } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import Reactionrole from "./reactionrole";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";

export default class ReactionroleContext extends Command {
  constructor(bot: ExtendedClient) {
    super(bot);

    this.commands = ["Create/Edit Reaction Role"];
    this.permissions = ["roles.reaction.modify"];
    this.example = null;
    this.type = Constants.ApplicationCommandTypes.MESSAGE;
  }

  public execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {
    const message = interaction.data.resolved.messages.first();
    if (!message) return interaction.createFollowup({content: "Message not found", flags: Constants.MessageFlags.EPHEMERAL});

    interaction.data.options = new InteractionOptionsWrapper(
      [
        {
          type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
          name: "modify",
          options: [
            {
              type: Constants.ApplicationCommandOptionTypes.STRING,
              name: "messageid",
              value: message.id
            }
          ]
        }
      ],
      interaction.data.options.resolved
    );

    await new Reactionrole(this.bot).execute(interaction);
    return;
  }
}