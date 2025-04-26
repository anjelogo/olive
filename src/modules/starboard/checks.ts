import { TextChannel } from "oceanic.js";
import ExtendedClient from "../../Base/Client";
import Roles, { moduleData } from "./main";

export default class Checks {

  readonly bot: ExtendedClient;
  readonly module: Roles

  constructor(bot: ExtendedClient, Module: Roles) {
    this.bot = bot;
    this.module = Module;
  }

  readonly run = async (): Promise<string> => {
    const data = (await this.bot.getAllData(this.module.name) as unknown) as moduleData[],
      promises = [];

    let deletedGuilds = 0,
      deletedStars = 0,
      failed = 0;

    async function deleteGuild(checks: Checks, guild: string) {
      if (!guild) return;
  
      try {
        await checks.bot.db.get(checks.module.name).findOneAndDelete({ guildID: guild });
        deletedGuilds++;
      } catch (e) {
        failed++;
      }
    }

    async function deleteStar(checks: Checks, guildData: moduleData, messageID: string) {
      if (!messageID) return;

      const i = guildData.messages.findIndex((m) => m.messageID === messageID);
      if (i > -1) guildData.messages.splice(i, 1);

      try {
        await checks.bot.updateModuleData(checks.module.name, guildData, guildData.guildID);
        deletedStars++;
      } catch (e) {
        failed++;
      }
    }

    for (const guildData of data) {

      const guild = this.bot.findGuild(guildData.guildID);

      if (!guild) {
        promises.push(await deleteGuild(this, guildData.guildID));
        continue;
      }

      for (const message of guildData.messages) {
        const channel = this.bot.findChannel(guild, message.channelID) as TextChannel;

        if (!channel) {
          promises.push(await deleteStar(this, guildData, message.messageID));
          continue;
        }

        const msg = this.bot.findMessage(channel, message.messageID);

        if (!msg) {
          promises.push(await deleteStar(this, guildData, message.messageID));
          continue;
        }
      }
    }

    await Promise.all(promises);

    return `${deletedGuilds} Guild(s) Deleted. ${deletedStars} Star(s) Deleted. ${failed} Failed Operation(s).`;


  }

  readonly checkVersion = async (): Promise<string> => {
    return "0 Guild(s) Versions Migrated.";
  }
}