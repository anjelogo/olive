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
  if (!guild || !user) return;

  const member = bot.findMember(guild as Guild, user.id);
  if (member && member.id === bot.user.id) return;

  const guildData = (await bot.getModuleData("Moderation", {
    guildID: guild.id,
  })) as ModerationModuleData;

  if (!guildData) return;
  if (!guildData.settings.autoModeration.enabled) return;
  if (!guildData.settings.autoModeration.rules.length) return;

  const rule = guildData.settings.autoModeration.rules.find(
    (r) => r.id === executionOptions.ruleID
  );
  if (!rule || !rule.enabled) return;

  let caseData;
  if (rule.action === "ban" || rule.action === "timeout") {
    caseData = generateCase(
      rule.action,
      member ? member.id : user.id,
      bot.user.id,
      null,
      `[**AUTO-MOD**] Triggered discord auto-moderation rule: ${rule.name}`
    );
  } else if (rule.action === "kick" || rule.action === "warn") {
    caseData = generateCase(
      rule.action,
      member ? member.id : user.id,
      bot.user.id,
      undefined,
      `[**AUTO-MOD**] Triggered discord auto-moderation rule: ${rule.name}`
    );
  }

  if (!caseData) return;

  await punish(bot, guild as Guild, caseData);
  await autoCalculateInfractions(
    bot,
    guild.id,
    member ? member.user : (user as User)
  );
};
