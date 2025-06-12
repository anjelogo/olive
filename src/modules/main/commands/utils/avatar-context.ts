import { CommandInteraction, Constants, InteractionOptionsWrapper } from "oceanic.js";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import Avatar from "./avatar";

export default class AvatarContext extends Command {
  
  constructor(bot: ExtendedClient) {
    super(bot);

    this.commands = ["View Avatar"];
    this.permissions = ["main.avatar"];
    this.type = Constants.ApplicationCommandTypes.USER;
  }

  public execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {
    const member = interaction.data.resolved.members.first();
    if (!member) return await interaction.createFollowup({content: "Member not found"});
  
    interaction.data.options = new InteractionOptionsWrapper(
      [
        {
          type: Constants.ApplicationCommandOptionTypes.USER,
          name: "user",
          value: member.id
        }
      ],
      interaction.data.options.resolved
    );

    await new Avatar(this.bot).execute(interaction);
    return;
  }
}
