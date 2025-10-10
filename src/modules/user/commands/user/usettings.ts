import { CommandInteraction, Constants } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";

export default class UserSettingsCommand extends Command {
  public type = Constants.ApplicationCommandTypes.CHAT_INPUT;

  constructor(bot: ExtendedClient) {
    super(bot);
    this.commands = ["usettings"]; // user settings
    this.description = "View or edit your personal settings.";
    this.options = [
      {
        name: "view",
        description: "View your current settings.",
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      },
      {
        name: "edit",
        description: "Edit your settings.",
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        options: [
          {
            name: "vc_notifications",
            description: "Enable or disable voice channel notifications.",
            type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
            required: true,
          },
        ],
      },
    ];
  }

  readonly execute = async (interaction: CommandInteraction) => {
    const subCommand = interaction.data.options.getSubCommand(true)[0];

    switch (subCommand) {
      case "view": {
        const userSettings = await this.bot.getModuleData("User", {
          userID: interaction.user.id,
        });
        if (!userSettings) {
          return interaction.createFollowup({
            content: `${this.bot.constants.emojis.x} You do not have any settings saved. Use /usettings edit to set your preferences.`,
          });
        }

        return interaction.createFollowup({
          content: `**Your Settings:**\n- Voice Channel Notifications: ${
            userSettings.notifications.vc ? "Enabled" : "Disabled"
          }`,
        });
      }
      case "edit": {
        const vcNotifications = interaction.data.options.getBoolean(
          "vc_notifications",
          true
        );

        let userSettings = await this.bot.getModuleData("User", {
          userID: interaction.user.id,
        });

        if (!userSettings) {
          throw new Error("User settings not found.");
        }

        // Update existing settings
        userSettings.notifications.vc = vcNotifications;

        await this.bot.updateModuleData<"User">("User", userSettings, {
          userID: interaction.user.id,
        });

        return interaction.createFollowup({
          content: `${this.bot.constants.emojis.tick} Your settings have been updated.`,
        });
      }
      default:
        return interaction.createFollowup({
          content: `${this.bot.constants.emojis.x} Unknown subcommand.`,
        });
    }
  };
}
