import ExtendedClient from "../../../Base/Client";
import { Constants, CreateAutoModerationRuleOptions, Guild } from "oceanic.js";
import { AutoModerationRule } from "oceanic.js";
import { AutoModRule, CaseActionTypes, ModerationModuleData } from "../../../Database/interfaces/ModerationModuleData";

export const Presets: Record<string, CreateAutoModerationRuleOptions & { action: CaseActionTypes }> = {
  "blank": {
    name: "New Auto-Moderation Rule",
    eventType: Constants.AutoModerationEventTypes.MESSAGE_SEND,
    triggerType: Constants.AutoModerationTriggerTypes.KEYWORD,
    triggerMetadata: {
      regexPatterns: [],
      allowList: []
    },
    actions: [
      {
        metadata: {
          customMessage: "[AUTO-MOD] Your message was blocked by Olive's Auto Moderation.",
        },
        type: Constants.AutoModerationActionTypes.BLOCK_MESSAGE
      }
    ],
    enabled: true,
    exemptRoles: [],
    exemptChannels: [],
    action: "warn"
  },
  "spam": {
    name: "Spam Prevention",
    eventType: Constants.AutoModerationEventTypes.MESSAGE_SEND,
    triggerType: Constants.AutoModerationTriggerTypes.SPAM,
    triggerMetadata: {},
    actions: [
      {
        metadata: {
          customMessage: "[AUTO-MOD] Your message was blocked by Olive's Auto Moderation.",
        },
        type: Constants.AutoModerationActionTypes.BLOCK_MESSAGE
      }
    ],
    enabled: true,
    exemptRoles: [],
    exemptChannels: [],
    action: "timeout"
  },
  "links": {
    name: "Block Keyword Links",
    eventType: Constants.AutoModerationEventTypes.MESSAGE_SEND,
    triggerType: Constants.AutoModerationTriggerTypes.KEYWORD,
    triggerMetadata: {
      regexPatterns: [
        "https?://[^\\s/$.?#].[^\\s]*",
        "www\\.[^\\s/$.?#].[^\\s]*",
      ],
      allowList: [
        "*.gif",
        "*.jpg",
        "*.jpeg",
        "*.png",
        "*.mp4",
        "https://tenor.com/*",
      ]
    },
    actions: [
      {
        metadata: {
          customMessage: "[AUTO-MOD] Your message was blocked by Olive's Auto Moderation.",
        },
        type: Constants.AutoModerationActionTypes.BLOCK_MESSAGE
      }
    ],
    enabled: true,
    exemptRoles: [],
    exemptChannels: [],
    action: "warn"
  },
  "mentions": {
    name: "Block Mentions Spam",
    eventType: Constants.AutoModerationEventTypes.MESSAGE_SEND,
    triggerType: Constants.AutoModerationTriggerTypes.MENTION_SPAM,
    triggerMetadata: {
      mentionRaidProtectionEnabled: true,
      mentionTotalLimit: 15
    },
    actions: [
      {
        metadata: {
          customMessage: "[AUTO-MOD] Your message was blocked by Olive's Auto Moderation.",
        },
        type: Constants.AutoModerationActionTypes.BLOCK_MESSAGE
      }
    ],
    enabled: true,
    exemptRoles: [],
    exemptChannels: [],
    action: "warn"
  },
  "emoji": {
    name: "Block Emoji Spam",
    eventType: Constants.AutoModerationEventTypes.MESSAGE_SEND,
    triggerType: Constants.AutoModerationTriggerTypes.SPAM,
    triggerMetadata: {
      regexPatterns: [
        "<a?:[a-z_0-9]+:[0-9]+>|\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]|[0-9#\*]\u{fe0f})"
      ]
    },
    actions: [
      {
        metadata: {
          customMessage: "[AUTO-MOD] Your message was blocked by Olive's Auto Moderation.",
        },
        type: Constants.AutoModerationActionTypes.BLOCK_MESSAGE
      }
    ],
    enabled: true,
    exemptRoles: [],
    exemptChannels: [],
    action: "warn"
  },
};

export type CreateAutoModRuleOptions = 
  | {
      preset: "blank";
      caseAction: CaseActionTypes;
      keywords: string[];
    }
  | {
      preset: Exclude<keyof typeof Presets, "blank">;
      caseAction: CaseActionTypes;
      keywords?: string[];
    };

export async function createAutoModRule(bot: ExtendedClient, guild: Guild, options: CreateAutoModRuleOptions): Promise<{
  discordRule: AutoModerationRule;
  internalRule: AutoModRule;
}> {
  const guildData = await bot.getModuleData("Moderation", { guildID: guild.id }) as ModerationModuleData;

  if (options.preset !== "blank" && options.keywords && options.keywords.length) {
    Presets[options.preset].triggerMetadata!.regexPatterns = options.keywords;
  }

  Presets[options.preset].name = "[Olive] " + Presets[options.preset].name;

  const discordRule = await guild.createAutoModerationRule(Presets[options.preset]);

  const rule: AutoModRule = {
    id: discordRule.id,
    name: `[Olive] ${Constants.AutoModerationActionTypes[discordRule.actions[0].type]} - ${Constants.AutoModerationTriggerTypes[discordRule.triggerType]}`,
    enabled: "true",
    action: options.caseAction
  }

  if (guildData) {
    guildData.settings.autoModeration.rules.push(rule);
    
    bot.updateModuleData("Moderation", guildData, { guildID: guild.id });
  }
  
  return {
    discordRule,
    internalRule: rule
  };
}

export async function modifyAutoModRule(bot: ExtendedClient, guild: Guild, ruleID: string, options: Partial<CreateAutoModerationRuleOptions> & { action?: CaseActionTypes }): Promise<{
  discordRule: AutoModerationRule;
  internalRule: AutoModRule;
} | null> {
  const guildData = await bot.getModuleData("Moderation", { guildID: guild.id }) as ModerationModuleData;

  if (!guildData) return null;

  const discordRule = await guild.editAutoModerationRule(ruleID, options),
    ruleIndex = guildData.settings.autoModeration.rules.findIndex((r) => r.id === discordRule.id);

  if (ruleIndex === -1) return null;

  if (options.name) guildData.settings.autoModeration.rules[ruleIndex].name = options.name;
  if (options.enabled !== undefined) guildData.settings.autoModeration.rules[ruleIndex].enabled = options.enabled ? "true" : "false";
  if (options.action) guildData.settings.autoModeration.rules[ruleIndex].action = options.action;

  bot.updateModuleData("Moderation", guildData, { guildID: guild.id });

  return {
    discordRule,
    internalRule: guildData.settings.autoModeration.rules[ruleIndex]
  };
}

export async function deleteAutoModRule(bot: ExtendedClient, guild: Guild, ruleID: string): Promise<boolean> {
  const guildData = await bot.getModuleData("Moderation", { guildID: guild.id }) as ModerationModuleData;

  if (!guildData) return false;

  const ruleIndex = guildData.settings.autoModeration.rules.findIndex((r) => r.id === ruleID);

  if (ruleIndex === -1) return false;

  try {
    await guild.deleteAutoModerationRule(ruleID);
  } catch {
    return false;
  }

  guildData.settings.autoModeration.rules.splice(ruleIndex, 1);

  bot.updateModuleData("Moderation", guildData, { guildID: guild.id });

  return true;
}