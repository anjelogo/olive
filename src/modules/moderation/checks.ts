import Module from "../../Base/Module";
import ExtendedClient from "../../Base/Client";
import Moderation from "./main";
import { ModerationModuleData } from "../../Database/interfaces/ModerationModuleData";

export default class Checks {

  readonly bot: ExtendedClient;
  readonly module: Module;

  constructor (bot: ExtendedClient, Module: Moderation) {
    this.bot = bot;
    this.module = Module;
  }

  readonly run = async (): Promise<string> => {
    const data = await this.bot.getAllData("Moderation") as ModerationModuleData[],
      promises = [];

    let deletedGuilds = 0,
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

    if (data.length) {
      for (const guildData of data) {

        const guild = this.bot.findGuild(guildData.guildID);

        if (!guild) {
          promises.push(await deleteGuild(this, guildData.guildID));
          continue;
        }
      }
    }

    await Promise.all(promises);

    return `${deletedGuilds} Guild(s) Deleted. ${failed} Failed Operation(s).`;

  }

  readonly checkVersion = async (newVersion: string): Promise<string> => {
    const data = await this.bot.getAllData("Moderation") as ModerationModuleData[],
      promises = [];

    if (data.length) {
      for (const guildData of data) {
        if (guildData.version === this.module.version) continue;

        switch (guildData.version) {

        case undefined:
        case "1.0": {
          //Migrates from 1.0 to 1.1
          if (guildData.version === newVersion) continue;
      
          const oldDataStruct = {
              guildID: guildData.guildID,
              cases: guildData.cases,
              settings: guildData.settings
            },
            newDataStruct = {
              version: newVersion,
              guildID: oldDataStruct.guildID,
              cases: oldDataStruct.cases,
              settings: oldDataStruct.settings
            };
      
          promises.push(await this.bot.updateModuleData("Moderation", newDataStruct, guildData.guildID));
          break;
        }
        }
      }
    }

    await Promise.all(promises);

    return `${promises.length} Guild(s) Versions Migrated.`;
  }

}