import {
  AnyTextableGuildChannel,
  AutoModerationActionExecution,
  Guild,
  Uncached,
  User,
} from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import { ModerationModuleData } from "../../../Database/interfaces/ModerationModuleData";
import {
  autoCalculateInfractions,
  punish,
} from "../internals/punishmentHandler";
import { generateCase } from "../internals/caseHandler";

export const run = async (
  bot: ExtendedClient,
  guild: Guild | Uncached,
  channel: null | Uncached | AnyTextableGuildChannel,
  user: User | Uncached,
  executionOptions: AutoModerationActionExecution
): Promise<void> => {
  console.log("Payload:", {
    guild,
    channel,
    user,
    executionOptions,
  });
  if (!guild && guild !== null) return;
  if (!user && user !== null) return;

  console.log("Triggered Auto-Mod Action:");

  const member = bot.findMember(guild as Guild, user.id);
  if (member) {
    console.log("Member found:", member.id);
    if (member.id === bot.user.id) return;
  }
  

  const guildData = (await bot.getModuleData("Moderation", {
    guildID: guild.id,
  })) as ModerationModuleData;

  if (!guildData) {
    console.log("No guild data found.");
    return;
  };
  if (!guildData.settings.autoModeration.enabled) {
    console.log("Auto-Mod is not enabled.");
    return;
  }
  if (!guildData.settings.autoModeration.rules.length) {
    console.log("No Auto-Mod rules found.");
    return;
  };

  console.log("Guild Data and Auto-Mod is enabled.");

  const rule = guildData.settings.autoModeration.rules.find(
    (r) => r.id === executionOptions.ruleID
  );
  if (!rule) return;
  if (rule.enabled !== "true") return;

  console.log("Rule found and is enabled:", rule.id, rule.name, rule.action);

  let caseData;
  if (rule.action === "ban" || rule.action === "timeout") {
    caseData = generateCase(
      rule.action,
      member ? member.id : user.id,
      bot.user.id,
      null, // duration
      `[**AUTO-MOD**] Triggered discord auto-moderation rule: ${rule.name}`
    );
  } else if (rule.action === "kick" || rule.action === "warn") {
    caseData = generateCase(
      rule.action,
      member ? member.id : user.id,
      bot.user.id,
      undefined, // duration not needed
      `[**AUTO-MOD**] Triggered discord auto-moderation rule: ${rule.name}`
    );
  }

  console.log("Case Data:", caseData);

  if (!caseData) return;

  await punish(bot, guild as Guild, caseData);
  await autoCalculateInfractions(
    bot,
    guild.id,
    member ? member.user : (user as User)
  );
};
