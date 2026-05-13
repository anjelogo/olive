import { CommandInteraction, Constants, Guild, ApplicationIntegrationTypes, InteractionContextTypes } from "oceanic.js";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import { RolesModuleData } from "../../../../Database/interfaces/RolesModuleData";

export default class Saveroles extends Command {

  public type = Constants.ApplicationCommandTypes.CHAT_INPUT;

  constructor(bot: ExtendedClient) {
    super(bot);

    this.commands = ["saveroles"];
    this.example = "saveroles";
    this.description = "Toggle Role Saving, which allows the bot to save roles when users leave or join the server.";
    this.permissions = ["roles.save.toggle"];
    this.integrationTypes = [ApplicationIntegrationTypes.GUILD_INSTALL];
    this.contexts = [InteractionContextTypes.GUILD];
  }

  readonly execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {
    const guild = this.bot.findGuild(interaction.guildID) as Guild,
      data = await this.bot.getModuleData("Roles", { guildID: guild.id }) as RolesModuleData,
      savedRoles = data.savedRoles;

    if (!savedRoles.enabled) data.savedRoles.enabled = true;
    else data.savedRoles.enabled = false;

  await this.bot.updateModuleData("Roles", data, { guildID: guild.id });

    return interaction.createFollowup({
      content: `${this.bot.constants.emojis.tick} Role Saving has been ${savedRoles.enabled ? "enabled" : "disabled"}`,
      flags: Constants.MessageFlags.EPHEMERAL
    });
  };

}