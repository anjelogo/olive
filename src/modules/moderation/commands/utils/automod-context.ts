import { CommandInteraction, ComponentInteraction, Constants, Guild, Message, MessageComponentSelectMenuInteractionData, ApplicationIntegrationTypes, InteractionContextTypes } from "oceanic.js";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import { ModerationModuleData } from "../../../../Database/interfaces/ModerationModuleData";
import { BucketKey } from "../../internals/bucketDataset";
import { synchroniseBucketRules } from "../../internals/autoModHandler";
import { upsertCustomData, getCustomData } from "../../../main/internals/CustomDataHandler";

export default class AutoModContext extends Command {

  public type = Constants.ApplicationCommandTypes.MESSAGE;

  constructor(bot: ExtendedClient) {
    super(bot);

    this.commands = ["Add to AutoMod Phrases"];
    this.permissions = ["moderation.automod.manage", "moderation.automod.*", "moderation.*"];
    this.integrationTypes = [ApplicationIntegrationTypes.GUILD_INSTALL];
    this.contexts = [InteractionContextTypes.GUILD];
  }

  public execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {
    const message = interaction.data.resolved.messages.first();
    if (!message) {
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.x} Message not found.`,
        flags: Constants.MessageFlags.EPHEMERAL,
      });
    }

    const phrase = message.content.trim().toLowerCase();
    if (!phrase) {
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.x} Message has no text content.`,
        flags: Constants.MessageFlags.EPHEMERAL,
      });
    }

    upsertCustomData(this.bot, interaction, { phrase });

    return interaction.createFollowup({
      components: [
        {
          type: Constants.ComponentTypes.CONTAINER,
          components: [
            {
              type: Constants.ComponentTypes.TEXT_DISPLAY,
              content: "# Add to AutoMod Phrases",
            },
            {
              type: Constants.ComponentTypes.TEXT_DISPLAY,
              content: `**Phrase:** \`${phrase.length > 120 ? phrase.slice(0, 120) + "…" : phrase}\`\n\nSelect the bucket to add this phrase to:`,
            },
            {
              type: Constants.ComponentTypes.ACTION_ROW,
              components: [
                {
                  type: Constants.ComponentTypes.STRING_SELECT,
                  customID: `automod_context_${interaction.member?.id}_bucketselect`,
                  placeholder: "Choose a bucket",
                  minValues: 1,
                  maxValues: 1,
                  options: [
                    { label: "Contact", value: "contact", description: "Phrases related to off-platform contact attempts" },
                    { label: "Giveaway", value: "giveaway", description: "Phrases related to fake giveaways/prizes" },
                    { label: "Payment", value: "payment", description: "Phrases related to payment/crypto scams" },
                    { label: "Spam", value: "spam", description: "Phrases related to server spam/promotion" },
                  ],
                },
              ],
            },
          ],
        },
      ],
      flags: Constants.MessageFlags.IS_COMPONENTS_V2 | Constants.MessageFlags.EPHEMERAL,
    });
  };

  readonly update = async (component: ComponentInteraction): Promise<Message | void> => {
    const guild = this.bot.findGuild(component.guildID) as Guild;
    const bucket = (component.data as MessageComponentSelectMenuInteractionData).values.getStrings()[0] as BucketKey;

    const stored = getCustomData(this.bot, component.message.interactionMetadata?.id as string);
    if (!stored) {
      return component.editOriginal({
        components: [
          {
            type: Constants.ComponentTypes.CONTAINER,
            components: [
              {
                type: Constants.ComponentTypes.TEXT_DISPLAY,
                content: `${this.bot.constants.emojis.x} Interaction expired. Run the command again.`,
              },
            ],
          },
        ],
      });
    }

    const phrase = stored.data.phrase as string;
    const guildData = (await this.bot.getModuleData("Moderation", { guildID: guild.id })) as ModerationModuleData;
    const customPhrases = guildData.settings.autoModeration.customPhrases ?? {};
    const existing = customPhrases[bucket] ?? [];

    if (existing.length >= 100) {
      return component.editOriginal({
        components: [
          {
            type: Constants.ComponentTypes.CONTAINER,
            components: [
              {
                type: Constants.ComponentTypes.TEXT_DISPLAY,
                content: `${this.bot.constants.emojis.x} Bucket \`${bucket}\` is full (100/100 phrases). Remove a phrase first.`,
              },
            ],
          },
        ],
      });
    }

    if (existing.includes(phrase)) {
      return component.editOriginal({
        components: [
          {
            type: Constants.ComponentTypes.CONTAINER,
            components: [
              {
                type: Constants.ComponentTypes.TEXT_DISPLAY,
                content: `${this.bot.constants.emojis.x} \`${phrase}\` already exists in \`${bucket}\`.`,
              },
            ],
          },
        ],
      });
    }

    guildData.settings.autoModeration.customPhrases = {
      ...customPhrases,
      [bucket]: [...existing, phrase],
    };

    await this.bot.updateModuleData("Moderation", guildData, { guildID: guild.id });
    await synchroniseBucketRules(this.bot, guild);

    return component.editOriginal({
      components: [
        {
          type: Constants.ComponentTypes.CONTAINER,
          components: [
            {
              type: Constants.ComponentTypes.TEXT_DISPLAY,
              content: `${this.bot.constants.emojis.tick} Added \`${phrase}\` to \`${bucket}\`. Discord rules synced.`,
            },
          ],
        },
      ],
    });
  };
}
