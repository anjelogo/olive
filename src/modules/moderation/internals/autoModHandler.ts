import ExtendedClient from "../../../Base/Client";
import { Constants, CreateAutoModerationRuleOptions, Guild } from "oceanic.js";
import { AutoModerationRule } from "oceanic.js";
import {
  AutoModRule,
  CaseActionTypes,
  ModerationModuleData,
} from "../../../Database/interfaces/ModerationModuleData";
import { BucketKey, GlobalBucketDataset } from "./bucketDataset";
import { compileBucket, CompiledChunk } from "./bucketCompiler";

export const Presets: Record<
  string,
  CreateAutoModerationRuleOptions & { action: CaseActionTypes }
> = {
  blank: {
    name: "Custom Rule",
    eventType: Constants.AutoModerationEventTypes.MESSAGE_SEND,
    triggerType: Constants.AutoModerationTriggerTypes.KEYWORD,
    triggerMetadata: {
      regexPatterns: [],
      allowList: [],
    },
    actions: [
      {
        metadata: {
          customMessage:
            "[AUTO-MOD] Your message was blocked by Olive's Auto Moderation.",
        },
        type: Constants.AutoModerationActionTypes.BLOCK_MESSAGE,
      },
    ],
    enabled: true,
    exemptRoles: [],
    exemptChannels: [],
    action: "warn",
  },
  spam: {
    name: "Spam Rule",
    eventType: Constants.AutoModerationEventTypes.MESSAGE_SEND,
    triggerType: Constants.AutoModerationTriggerTypes.SPAM,
    triggerMetadata: {},
    actions: [
      {
        metadata: {
          customMessage:
            "[AUTO-MOD] Your message was blocked by Olive's Auto Moderation.",
        },
        type: Constants.AutoModerationActionTypes.BLOCK_MESSAGE,
      },
    ],
    enabled: true,
    exemptRoles: [],
    exemptChannels: [],
    action: "timeout",
  },
  links: {
    name: "Links Rule",
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
      ],
    },
    actions: [
      {
        metadata: {
          customMessage:
            "[AUTO-MOD] Your message was blocked by Olive's Auto Moderation.",
        },
        type: Constants.AutoModerationActionTypes.BLOCK_MESSAGE,
      },
    ],
    enabled: true,
    exemptRoles: [],
    exemptChannels: [],
    action: "warn",
  },
  mentions: {
    name: "Mentions Rule",
    eventType: Constants.AutoModerationEventTypes.MESSAGE_SEND,
    triggerType: Constants.AutoModerationTriggerTypes.MENTION_SPAM,
    triggerMetadata: {
      mentionRaidProtectionEnabled: true,
      mentionTotalLimit: 15,
    },
    actions: [
      {
        metadata: {
          customMessage:
            "[AUTO-MOD] Your message was blocked by Olive's Auto Moderation.",
        },
        type: Constants.AutoModerationActionTypes.BLOCK_MESSAGE,
      },
    ],
    enabled: true,
    exemptRoles: [],
    exemptChannels: [],
    action: "warn",
  },
  emoji: {
    name: "Emoji Rule",
    eventType: Constants.AutoModerationEventTypes.MESSAGE_SEND,
    triggerType: Constants.AutoModerationTriggerTypes.SPAM,
    triggerMetadata: {
      regexPatterns: [
        "<a?:[a-z_0-9]+:[0-9]+>|p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]|[0-9#*]\u{fe0f})",
      ],
    },
    actions: [
      {
        metadata: {
          customMessage:
            "[AUTO-MOD] Your message was blocked by Olive's Auto Moderation.",
        },
        type: Constants.AutoModerationActionTypes.BLOCK_MESSAGE,
      },
    ],
    enabled: true,
    exemptRoles: [],
    exemptChannels: [],
    action: "warn",
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

export async function createAutoModRule(
  bot: ExtendedClient,
  guild: Guild,
  options: CreateAutoModRuleOptions
): Promise<{
  discordRule: AutoModerationRule;
  internalRule: AutoModRule;
}> {
  const guildData = (await bot.getModuleData("Moderation", {
    guildID: guild.id,
  })) as ModerationModuleData;

  // preset is a global, clone it or you'll regret it
  const presetClone = {
    ...Presets[options.preset],
    triggerMetadata: { ...Presets[options.preset].triggerMetadata },
  };

  if (
    options.preset !== "blank" &&
    options.keywords &&
    options.keywords.length
  ) {
    presetClone.triggerMetadata!.keywordFilter = options.keywords;
  }

  presetClone.name = "[Olive] " + presetClone.name;

  const discordRule = await guild.createAutoModerationRule(presetClone);

  const rule: AutoModRule = {
    id: discordRule.id,
    name: `[Olive] ${
      Constants.AutoModerationActionTypes[discordRule.actions[0].type]
    } - ${Constants.AutoModerationTriggerTypes[discordRule.triggerType]}`,
    enabled: true,
    action: options.caseAction,
    ruleMetadata: {
      preset: options.preset,
      keywords: options.keywords,
      regexPatterns: discordRule.triggerMetadata?.regexPatterns,
      allowList: discordRule.triggerMetadata?.allowList,
      mentionTotalLimit: discordRule.triggerMetadata?.mentionTotalLimit,
      mentionRaidProtectionEnabled:
        discordRule.triggerMetadata?.mentionRaidProtectionEnabled,
    },
  };

  if (guildData) {
    guildData.settings.autoModeration.rules.push(rule);

    bot.updateModuleData("Moderation", guildData, { guildID: guild.id });
  }

  return {
    discordRule,
    internalRule: rule,
  };
}

export async function modifyAutoModRule(
  bot: ExtendedClient,
  guild: Guild,
  ruleID: string,
  options: Partial<CreateAutoModerationRuleOptions> & {
    action?: CaseActionTypes;
  }
): Promise<{
  discordRule: AutoModerationRule;
  internalRule: AutoModRule;
} | null> {
  const guildData = (await bot.getModuleData("Moderation", {
    guildID: guild.id,
  })) as ModerationModuleData;

  if (!guildData) return null;

  const discordRule = await guild.editAutoModerationRule(ruleID, options),
    ruleIndex = guildData.settings.autoModeration.rules.findIndex(
      (r) => r.id === discordRule.id
    );

  if (ruleIndex === -1) return null;

  if (options.name)
    guildData.settings.autoModeration.rules[ruleIndex].name = options.name;
  if (options.enabled !== undefined)
    guildData.settings.autoModeration.rules[ruleIndex].enabled = options.enabled as boolean;
  if (options.action)
    guildData.settings.autoModeration.rules[ruleIndex].action = options.action;

  // update ruleMetadata based on preset
  // if preset is changed, update all metadata to match preset

  bot.updateModuleData("Moderation", guildData, { guildID: guild.id });

  return {
    discordRule,
    internalRule: guildData.settings.autoModeration.rules[ruleIndex],
  };
}

export async function deleteAutoModRule(
  bot: ExtendedClient,
  guild: Guild,
  ruleID: string
): Promise<boolean> {
  const guildData = (await bot.getModuleData("Moderation", {
    guildID: guild.id,
  })) as ModerationModuleData;

  if (!guildData) return false;

  const ruleIndex = guildData.settings.autoModeration.rules.findIndex(
    (r) => r.id === ruleID
  );

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

export async function synchroniseAutoModRules(
  bot: ExtendedClient,
  guild: Guild
): Promise<void> {
  const guildData = (await bot.getModuleData("Moderation", {
    guildID: guild.id,
  })) as ModerationModuleData;

  if (!guildData) return;

  // coerce enabled: existing db docs may have "true"/"false" strings
  for (const r of guildData.settings.autoModeration.rules) {
    if (typeof (r.enabled as unknown) === "string") {
      r.enabled = (r.enabled as unknown as string) === "true";
    }
  }

  const discordRules = await guild.getAutoModerationRules();

  // snapshot db-only before the filter removes them
  const dbOnlyRules = guildData.settings.autoModeration.rules.filter(
    (r) => !discordRules.some((dr) => dr.id === r.id)
  );

  // Remove any rules that no longer exist on Discord
  guildData.settings.autoModeration.rules =
    guildData.settings.autoModeration.rules.filter((r) =>
      discordRules.some((dr) => dr.id === r.id)
    );

  // recreate db-only rules on Discord with fresh ids
  for (const r of dbOnlyRules) {
    const preset = r.ruleMetadata.preset;
    if (!preset || !Presets[preset]) continue;
    const presetClone = {
      ...Presets[preset],
      triggerMetadata: { ...Presets[preset].triggerMetadata },
    };
    presetClone.name = "[Olive] " + presetClone.name;
    const discordRule = await guild.createAutoModerationRule(presetClone);
    guildData.settings.autoModeration.rules.push({ ...r, id: discordRule.id });
  }

  // Note: We do not delete rules that exist on Discord but not in the database
  // as they may have been created manually by the server admin
  
  // Update names and enabled status of existing rules
  for (const r of guildData.settings.autoModeration.rules) {
    const discordRule = discordRules.find((dr) => dr.id === r.id);
    if (discordRule) {
      r.name = discordRule.name;
      r.enabled = discordRule.enabled;
    }
  }

  // update trigger words for rules that use keywords
  for (const r of guildData.settings.autoModeration.rules) {
    if (
      r.ruleMetadata.preset !== "blank" &&
      r.ruleMetadata.keywords &&
      r.ruleMetadata.keywords.length
    ) {
      const discordRule = discordRules.find((dr) => dr.id === r.id);
      if (discordRule) {
        discordRule.triggerMetadata.keywordFilter = r.ruleMetadata.keywords;
        await guild.editAutoModerationRule(discordRule.id, {
          triggerMetadata: discordRule.triggerMetadata,
        });
      }
    }
  }

  await bot.updateModuleData("Moderation", guildData, { guildID: guild.id });
  return;
}

export async function synchroniseBucketRules(
  bot: ExtendedClient,
  guild: Guild
): Promise<void> {
  const guildData = (await bot.getModuleData("Moderation", {
    guildID: guild.id,
  })) as ModerationModuleData;

  if (!guildData) return;

  const discordRules = await guild.getAutoModerationRules();
  const existingBucketRules = discordRules.filter(r => r.name.startsWith("olive:"));

  const buckets: BucketKey[] = ["contact", "giveaway", "payment", "spam"];
  const allChunks: (CompiledChunk & { bucket: BucketKey })[] = [];

  for (const bucket of buckets) {
    const globalPhrases = GlobalBucketDataset[bucket];
    const customPhrases = guildData.settings.autoModeration.customPhrases?.[bucket] ?? [];
    const chunks = compileBucket(bucket, [...globalPhrases, ...customPhrases]);
    for (const chunk of chunks) allChunks.push({ ...chunk, bucket });
  }

  const targetNames = new Set(allChunks.map(c => c.name));

  for (const dr of existingBucketRules) {
    if (!targetNames.has(dr.name)) await guild.deleteAutoModerationRule(dr.id);
  }

  const synced: { name: string; id: string; bucket: BucketKey }[] = [];

  for (const chunk of allChunks) {
    const existing = existingBucketRules.find(dr => dr.name === chunk.name);
    if (existing) {
      await guild.editAutoModerationRule(existing.id, {
        triggerMetadata: {
          keywordFilter: chunk.keywords,
          regexPatterns: chunk.regexPatterns,
        },
      });
      synced.push({ name: chunk.name, id: existing.id, bucket: chunk.bucket });
    } else {
      const created = await guild.createAutoModerationRule({
        name: chunk.name,
        eventType: Constants.AutoModerationEventTypes.MESSAGE_SEND,
        triggerType: Constants.AutoModerationTriggerTypes.KEYWORD,
        triggerMetadata: {
          keywordFilter: chunk.keywords,
          regexPatterns: chunk.regexPatterns,
        },
        actions: [{
          metadata: {
            customMessage: "[AUTO-MOD] Your message was blocked by Olive's Auto Moderation.",
          },
          type: Constants.AutoModerationActionTypes.BLOCK_MESSAGE,
        }],
        enabled: true,
        exemptRoles: [],
        exemptChannels: [],
      });
      synced.push({ name: chunk.name, id: created.id, bucket: chunk.bucket });
    }
  }

  guildData.settings.autoModeration.rules = guildData.settings.autoModeration.rules.filter(
    r => !r.name.startsWith("olive:")
  );
  for (const { name, id, bucket } of synced) {
    guildData.settings.autoModeration.rules.push({
      id,
      name,
      enabled: true,
      action: "warn",
      ruleMetadata: { preset: `bucket:${bucket}` },
    });
  }

  await bot.updateModuleData("Moderation", guildData, { guildID: guild.id });
}
