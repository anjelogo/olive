import { CommandInteraction, Constants, Guild, ApplicationIntegrationTypes, InteractionContextTypes } from "oceanic.js";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import { ModerationModuleData } from "../../../../Database/interfaces/ModerationModuleData";
import { BucketKey } from "../../internals/bucketDataset";
import { synchroniseAutoModRules, synchroniseBucketRules } from "../../internals/autoModHandler";
import { validateDuration } from "../../internals/durationHandler";

const BUCKET_CHOICES = [
  { name: "Contact", value: "contact" },
  { name: "Giveaway", value: "giveaway" },
  { name: "Payment", value: "payment" },
  { name: "Spam", value: "spam" },
];

export default class AutoMod extends Command {

  public type = Constants.ApplicationCommandTypes.CHAT_INPUT;

  constructor(bot: ExtendedClient) {
    super(bot);

    this.commands = ["automod"];
    this.description = "Manage Discord auto-moderation settings";
    this.example = "automod toggle";
    this.permissions = ["moderation.automod.manage", "moderation.automod.*", "moderation.*"];

    this.options = [
      {
        name: "toggle",
        description: "Enable or disable Discord auto-moderation for this server",
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      },
      {
        name: "sync",
        description: "Force sync bucket rules to Discord",
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      },
      {
        name: "phrases",
        description: "Manage custom phrases for auto-moderation buckets",
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
        options: [
          {
            name: "add",
            description: "Add a custom phrase to a bucket",
            type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            options: [
              {
                name: "bucket",
                description: "The bucket to add the phrase to",
                type: Constants.ApplicationCommandOptionTypes.STRING,
                required: true,
                choices: BUCKET_CHOICES,
              },
              {
                name: "phrase",
                description: "The phrase to add (max 100 phrases per bucket)",
                type: Constants.ApplicationCommandOptionTypes.STRING,
                required: true,
              },
            ],
          },
          {
            name: "remove",
            description: "Remove a custom phrase from a bucket",
            type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            options: [
              {
                name: "bucket",
                description: "The bucket to remove the phrase from",
                type: Constants.ApplicationCommandOptionTypes.STRING,
                required: true,
                choices: BUCKET_CHOICES,
              },
              {
                name: "phrase",
                description: "The phrase to remove",
                type: Constants.ApplicationCommandOptionTypes.STRING,
                required: true,
              },
            ],
          },
          {
            name: "list",
            description: "List custom phrases for a bucket",
            type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            options: [
              {
                name: "bucket",
                description: "The bucket to list phrases for",
                type: Constants.ApplicationCommandOptionTypes.STRING,
                required: true,
                choices: BUCKET_CHOICES,
              },
            ],
          },
        ],
      },
      {
        name: "rule",
        description: "View and configure auto-moderation rules",
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
        options: [
          {
            name: "list",
            description: "List configured rules with their IDs and settings",
            type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            options: [
              {
                name: "page",
                description: "Page number (10 rules per page)",
                type: Constants.ApplicationCommandOptionTypes.INTEGER,
                required: false,
              },
            ],
          },
          {
            name: "set",
            description: "Set action, duration, or silent flag on a rule by ID",
            type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            options: [
              {
                name: "id",
                description: "Rule ID (from /automod rule list)",
                type: Constants.ApplicationCommandOptionTypes.STRING,
                required: true,
              },
              {
                name: "action",
                description: "Punishment action for this rule",
                type: Constants.ApplicationCommandOptionTypes.STRING,
                required: false,
                choices: [
                  { name: "Ban", value: "ban" },
                  { name: "Kick", value: "kick" },
                  { name: "Timeout", value: "timeout" },
                  { name: "Warn", value: "warn" },
                ],
              },
              {
                name: "duration",
                description: "Duration for timeout/ban (e.g. 10m, 1h, 7d)",
                type: Constants.ApplicationCommandOptionTypes.STRING,
                required: false,
              },
              {
                name: "silent",
                description: "Suppress mod-log entry when this rule triggers",
                type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
                required: false,
              },
            ],
          },
        ],
      },
    ];
    this.integrationTypes = [ApplicationIntegrationTypes.GUILD_INSTALL];
    this.contexts = [InteractionContextTypes.GUILD];
  }

  readonly execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {
    const guild = this.bot.findGuild(interaction.guildID) as Guild;
    const guildData = (await this.bot.getModuleData("Moderation", { guildID: guild.id })) as ModerationModuleData;

    const path = interaction.data.options.getSubCommand(true);
    const group = path[0];
    const sub = path[1];

    switch (group) {

    case "toggle": {
      const newState = !guildData.settings.autoModeration.enabled;
      guildData.settings.autoModeration.enabled = newState;
      await this.bot.updateModuleData("Moderation", guildData, { guildID: guild.id });
      await synchroniseAutoModRules(this.bot, guild);
      await synchroniseBucketRules(this.bot, guild);
      return interaction.createFollowup({
        content: `${newState ? this.bot.constants.emojis.tick : this.bot.constants.emojis.x} Discord auto-moderation **${newState ? "enabled" : "disabled"}**.`,
      });
    }

    case "sync": {
      await synchroniseAutoModRules(this.bot, guild);
      await synchroniseBucketRules(this.bot, guild);
      const refreshed = (await this.bot.getModuleData("Moderation", { guildID: guild.id })) as ModerationModuleData;
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.tick} Synced. ${refreshed.settings.autoModeration.rules.length} rule(s) active.`,
      });
    }

    case "phrases": {
      const bucket = interaction.data.options.getString("bucket", true) as BucketKey;
      const customPhrases = guildData.settings.autoModeration.customPhrases ?? {};
      const existing = customPhrases[bucket] ?? [];

      switch (sub) {

      case "add": {
        const phrase = interaction.data.options.getString("phrase", true).trim().toLowerCase();
        if (existing.length >= 100) {
          return interaction.createFollowup({
            content: `${this.bot.constants.emojis.x} Bucket \`${bucket}\` is full (100/100 phrases).`,
          });
        }
        if (existing.includes(phrase)) {
          return interaction.createFollowup({
            content: `${this.bot.constants.emojis.x} \`${phrase}\` already exists in \`${bucket}\`.`,
          });
        }
        guildData.settings.autoModeration.customPhrases = {
          ...customPhrases,
          [bucket]: [...existing, phrase],
        };
        await this.bot.updateModuleData("Moderation", guildData, { guildID: guild.id });
        await synchroniseBucketRules(this.bot, guild);
        return interaction.createFollowup({
          content: `${this.bot.constants.emojis.tick} Added \`${phrase}\` to \`${bucket}\`.`,
        });
      }

      case "remove": {
        const phrase = interaction.data.options.getString("phrase", true).trim().toLowerCase();
        const filtered = existing.filter(p => p !== phrase);
        if (filtered.length === existing.length) {
          return interaction.createFollowup({
            content: `${this.bot.constants.emojis.x} \`${phrase}\` not found in \`${bucket}\`.`,
          });
        }
        guildData.settings.autoModeration.customPhrases = {
          ...customPhrases,
          [bucket]: filtered,
        };
        await this.bot.updateModuleData("Moderation", guildData, { guildID: guild.id });
        await synchroniseBucketRules(this.bot, guild);
        return interaction.createFollowup({
          content: `${this.bot.constants.emojis.tick} Removed \`${phrase}\` from \`${bucket}\`.`,
        });
      }

      case "list": {
        return interaction.createFollowup({
          components: [
            {
              type: Constants.ComponentTypes.CONTAINER,
              components: [
                {
                  type: Constants.ComponentTypes.TEXT_DISPLAY,
                  content: `# Custom Phrases — ${bucket} (${existing.length}/100)`,
                },
                {
                  type: Constants.ComponentTypes.TEXT_DISPLAY,
                  content: existing.length
                    ? existing.map((p, i) => `${i + 1}. \`${p}\``).join("\n")
                    : "No custom phrases set for this bucket.",
                },
              ],
            },
          ],
          flags: Constants.MessageFlags.IS_COMPONENTS_V2,
        });
      }

      }
    }

    case "rule": {
      switch (sub) {

      case "list": {
        const PAGE_SIZE = 10;
        const page = interaction.data.options.getInteger("page") ?? 1;
        const rules = guildData.settings.autoModeration.rules;
        const totalPages = Math.max(1, Math.ceil(rules.length / PAGE_SIZE));
        const clamped = Math.min(Math.max(page, 1), totalPages);
        const slice = rules.slice((clamped - 1) * PAGE_SIZE, clamped * PAGE_SIZE);
        const lines = slice.length
          ? slice.map(r =>
              `**${r.id}** — \`${r.name}\` | \`${r.action}\`${r.actionDuration ? ` | \`${r.actionDuration}\`` : ""}${r.actionSilent ? " | silent" : ""} | ${r.enabled ? "enabled" : "disabled"}`
            ).join("\n")
          : "No rules configured.";
        return interaction.createFollowup({
          components: [
            {
              type: Constants.ComponentTypes.CONTAINER,
              components: [
                {
                  type: Constants.ComponentTypes.TEXT_DISPLAY,
                  content: `# Auto-Mod Rules (page ${clamped}/${totalPages})`,
                },
                {
                  type: Constants.ComponentTypes.TEXT_DISPLAY,
                  content: lines,
                },
              ],
            },
          ],
          flags: Constants.MessageFlags.IS_COMPONENTS_V2,
        });
      }

      case "set": {
        const id = interaction.data.options.getString("id", true);
        const actionOpt = interaction.data.options.getString("action") ?? undefined;
        const durationOpt = interaction.data.options.getString("duration") ?? undefined;
        const silentOpt = interaction.data.options.getBoolean("silent") ?? undefined;

        if (durationOpt !== undefined && !validateDuration(durationOpt)) {
          return interaction.createFollowup({
            content: `${this.bot.constants.emojis.x} Invalid duration (e.g. \`10m\`, \`1h\`, \`7d\`).`,
          });
        }

        const rule = guildData.settings.autoModeration.rules.find(r => r.id === id);
        if (!rule) {
          return interaction.createFollowup({
            content: `${this.bot.constants.emojis.x} Rule \`${id}\` not found.`,
          });
        }

        if (actionOpt !== undefined) rule.action = actionOpt as typeof rule.action;
        if (durationOpt !== undefined) rule.actionDuration = durationOpt;
        if (silentOpt !== undefined) rule.actionSilent = silentOpt;

        await this.bot.updateModuleData("Moderation", guildData, { guildID: guild.id });
        await synchroniseAutoModRules(this.bot, guild);

        return interaction.createFollowup({
          content: `${this.bot.constants.emojis.tick} Rule \`${rule.name}\` updated.`,
        });
      }

      }
    }

    }
  };
}
