import { CommandInteraction, Constants, Guild } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import { createAutoModRule, Presets } from "../../internals/autoModHandler";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";
import { CaseActionTypes } from "../../../../Database/interfaces/ModerationModuleData";

export default class CreateAutoModRule extends Command {

  public type = Constants.ApplicationCommandTypes.CHAT_INPUT;
  public devOnly: boolean = true;

  constructor(bot: ExtendedClient) {
    super (bot);

    this.commands = ["createautomodrule"];
    this.example = "createautomodrule spam timeout";
    this.description = "Creates a test auto moderation rule in the server";
    this.options = [
      {
        name: "preset",
        description: "The preset to use",
        type: Constants.ApplicationCommandOptionTypes.STRING,
        required: true,
        choices: [
          {
            name: "Block Spam Prevention",
            value: "spam"
          },
          {
            name: "Block Toggle Keyword Links",
            value: "links"
          },
          {
            name: "Block Mentions Spam",
            value: "mentions"
          }, {
            name: "Block Emoji Spam",
            value: "emoji"
          }
        ]
      }, {
        name: "action",
        description: "The action to take",
        type: Constants.ApplicationCommandOptionTypes.STRING,
        required: true,
        choices: [
          {
            name: "Warn",
            value: "warn"
          },
          {
            name: "Kick",
            value: "kick"
          },
          {
            name: "Timeout",
            value: "timeout"
          },
          {
            name: "Ban",
            value: "ban"
          }
        ]
      }
    ];
  }

  readonly execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {


    const preset = interaction.data.options.getStringOption("preset")?.value as string,
      action = interaction.data.options.getStringOption("action")?.value as CaseActionTypes;

    const autoModRule = await createAutoModRule(this.bot, interaction.guild as Guild, {
      preset: preset as keyof typeof Presets,
      caseAction: action,
    });

    if (autoModRule) {
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.tick} Created test auto-moderation rule **${autoModRule.internalRule.name}** with action **${autoModRule.internalRule.action}**. You can view and manage this rule in your server settings.`,
      });
    } else {
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.x} Failed to create test auto-moderation rule. Please ensure I have the \`MANAGE_GUILD\` and \`MANAGE_MESSAGES\` permissions.`,
      });
    }

    return;
  };

}