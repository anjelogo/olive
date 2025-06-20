import ExtendedClient from "../../../Base/Client";
import { ModerationModuleData } from "../../../Database/interfaces/ModerationModuleData";
import { resolveCase } from "../internals/caseHandler";

export const run = async (bot: ExtendedClient): Promise<void> => {

  // Auto resolve cases when the duration has passed
  // 30 minute interval
  setInterval(async () => {
    const data = await bot.getAllData("Moderation") as ModerationModuleData[];
    const promises = [];
    for (const guildData of data) {
      if (!guildData.cases || !guildData.cases.length) continue;
      for (const caseData of guildData.cases) {
        if (caseData.resolved) continue;
        if (caseData.expiresAt && caseData.expiresAt !== null) {
          const guild = bot.findGuild(guildData.guildID);
          if (!guild) continue;
          if (caseData.expiresAt && new Date(caseData.expiresAt).getTime() <= Date.now()) {
            promises.push(resolveCase(bot, guild, caseData.id, bot.user.id, "[**AUTO-MOD**] Case expired."));
          }
        }
      }
    }

    await Promise.all(promises).catch((e) => {
      bot.constants.utils.log("Moderation", `Error resolving cases: ${e.message}`);
    });
  }, 30 * 60 * 1000);

  bot.constants.utils.log("Moderation", "Ready!");

};