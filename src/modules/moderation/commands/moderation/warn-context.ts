import { AnyInteractionChannel, CommandInteraction, Constants, InteractionCallbackResponse, Member, Uncached } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";
import { isPunishable } from "../../internals/punishmentHandler";

export default class WarnContext extends Command {
    
  constructor(bot: ExtendedClient) {
    super(bot);

    this.commands = ["Warn User"];
    this.permissions = ["moderation.punish.warn", "moderation.punish.*"];
    this.example = null;
    this.noDefer = true;
    this.type = Constants.ApplicationCommandTypes.USER;
  }

  public execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | InteractionCallbackResponse<AnyInteractionChannel | Uncached> | void> => {
    const member = interaction.data.resolved.members.first();
    if (!member) return interaction.createFollowup({content: `${this.bot.constants.emojis.x} Member not found`});

    if (!isPunishable(this.bot, interaction.member as Member, member)) {
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.x} You can't warn that user!`,
      });
    }


    return await interaction.createModal({
      title: `Reason to Warn @${member.username}`,
      customID: `warn_${interaction.member?.id}_warnmember_${member.id}`,
      components: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.TEXT_INPUT,
              customID: `warn_${interaction.member?.id}_reason_${member.id}`,
              label: "Reason",
              style: Constants.TextInputStyles.SHORT,
              required: true,
            },
          ],
        },
      ],
    });
  }
}