import { CommandInteraction, Constants, InteractionOptionsWrapper } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";
import Ban from "./ban";

export default class BanContext extends Command {

  constructor(bot: ExtendedClient) {

    super(bot);

    this.commands = ["Ban Member"];
    this.description = "Bans the member from the server";
    this.permissions = ["moderation.punish.ban", "moderation.punish.*"];
    this.type = Constants.ApplicationCommandTypes.USER;

  }

  public execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {
    const member = interaction.data.resolved.members.first();
    if (!member) return interaction.createFollowup({content: `${this.bot.constants.emojis.x} Member not found`});

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

    await new Ban(this.bot).execute(interaction);
    return;
  }
}