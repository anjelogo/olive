import { CommandInteraction, Constants } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";

export default class UserSettingsCommand extends Command {
  public type = Constants.ApplicationCommandTypes.CHAT_INPUT;

  constructor(bot: ExtendedClient) {
    super(bot);
    this.commands = ["usettings"]; // user settings
    this.description = "View or edit your personal settings.";
    this.permissions = []; // no special perms; per-user
  }

  readonly execute = async (interaction: CommandInteraction) => {
    return interaction.createFollowup({
      content: "User settings command placeholder.",
      flags: Constants.MessageFlags.EPHEMERAL
    });
  };
}
