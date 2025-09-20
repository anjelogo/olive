import Module from "../../Base/Module";
import { ModerationModuleData } from "../../Database/interfaces/ModerationModuleData";
import ExtendedClient from "../../Base/Client";
import Moderation from "./main";
import { durationToMS } from "./internals/durationHandler";

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

  };

  readonly checkVersion = async (newVersion: string): Promise<string> => {
    const data = await this.bot.getAllData("Moderation") as ModerationModuleData[],
      promises = [];

    if (data.length) {
      for (const guildData of data) {
        if (guildData.version === this.module.version) continue;

        switch (guildData.version) {

        case "0.0":
        case "1.0":
        case "1.1":
        case "1.2": {
          //Migrates from 1.0-1.2 to 1.4
          if (guildData.version === newVersion) continue;
      
          const newDataStruct = {
            ...guildData,
            enabled: true,
            version: newVersion,
            settings: {
              ...guildData.settings,
              autoPunish: {
                enabled: true,
                infractionsUntilWarn: 1,
                infractionsUntilBan: guildData.settings.infractionUntilBan as number,
                infractionsUntilKick: guildData.settings.infractionUntilKick as number,
                infractionsUntilTimeout: guildData.settings.infractionUntilTimeout as number
              }
            }
          };

          delete newDataStruct.settings.infractionUntilBan;
          delete newDataStruct.settings.infractionUntilKick;
          delete newDataStruct.settings.infractionUntilTimeout;

          for (const caseData of newDataStruct.cases) {
            if (caseData.time) {
              caseData.duration = caseData.time;
              const ms = durationToMS(caseData.time) as number;
              caseData.expiresAt = new Date(Date.now() + ms).toISOString();
              
              delete caseData.time;
            } else if (caseData !== undefined) {
              caseData.expiresAt = null;
              caseData.duration = null;

              delete caseData.time;
            }
          }
      
          promises.push(await this.bot.updateModuleData("Moderation", newDataStruct, { guildID: guildData.guildID }));
          break;
        }
        case "1.3": {
          //Migrates from 1.3 to 1.4
          if (guildData.version === newVersion) continue;
          
          const newDataStruct = {
            ...guildData,
            version: newVersion
          };

          for (const caseData of newDataStruct.cases) {
            if (caseData.time) {
              caseData.duration = caseData.time;
              const ms = durationToMS(caseData.time) as number;
              caseData.expiresAt = new Date(Date.now() + ms).toISOString();
              
              delete caseData.time;
            } else if (caseData !== undefined) {
              caseData.expiresAt = null;
              caseData.duration = null;

              delete caseData.time;
            }
          }

          promises.push(await this.bot.updateModuleData("Moderation", newDataStruct, { guildID: guildData.guildID }));
          break;
        }
        }
      }
    }

    await Promise.all(promises);

    return `${promises.length} Guild(s) Versions Migrated.`;
  };

}