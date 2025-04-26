import { CommandInteraction, Constants } from "oceanic.js";
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

    const interactionData = {
      type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      name: "modify",
      options: [
        {
          type: Constants.ApplicationCommandOptionTypes.STRING,
          name: "messageid",
          value: message.id
        }
      ]
    };

    const mockInteraction = Object.assign({}, interaction, { data: interactionData });
    await new Reactionrole(this.bot).execute(mockInteraction as unknown as CommandInteraction);
    return;
  }
}