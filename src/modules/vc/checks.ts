import { CategoryChannel, Guild, Member, VoiceChannel } from "oceanic.js";
import ExtendedClient from "../../Base/Client";
import { create } from "./internals/handler";
import VC from "./main";
import { Category, VCModuleData } from "../../Database/interfaces/VCModuleData";

export default class Checks {

  readonly bot: ExtendedClient;
  readonly module: VC;

  constructor(bot: ExtendedClient, Module: VC) {
    this.bot = bot;
    this.module = Module;
  }

  readonly run = async (): Promise<string> => {
    const data = await this.bot.getAllData(this.module.name) as VCModuleData[],
      promises = [];

    let deletedGuilds = 0,
      deletedChannels = 0,
      createdChannels = 0,
      failed = 0;

    async function deleteGuild(checks: Checks, guild: string) {
      if (!guild) return;

      try {
        await checks.bot.db.get(checks.module.name).findOneAndDelete({ guildID: guild});
        deletedGuilds++;
      } catch (e) {
        failed++;
      }
    }

    async function deleteCategory(checks: Checks, guildData: VCModuleData, channel: string) {
      if (!guildData) return;
    
      const i = guildData.categories.findIndex((c) => c.catID === channel);
      if (i > -1) guildData.categories.splice(i, 1);

      try {
        await checks.bot.updateModuleData(checks.module.name, guildData, guildData.guildID);
        deletedChannels++;
      } catch (e) {
        failed++;
      }
    }

    async function deleteChannel(checks: Checks, guildData: VCModuleData, catData: Category, channel: string) {
      if (!guildData || !catData)
        return;
    
      const i = catData.channels.findIndex((c) => c.channelID === channel);
      if (i > -1) catData.channels.splice(i, 1);
    
      try {
        await checks.bot.updateModuleData(checks.module.name, guildData, guildData.guildID);
        deletedChannels++;
      } catch (e) {
        failed++;
      }
    
    }

    if (data.length) {
      for (const guildData of data) {
        const guild: Guild = this.bot.findGuild(guildData.guildID) as Guild;

        if (!guild) {
          promises.push(await deleteGuild(this, guildData.guildID));
          continue;
        }
  
        if (!guildData.categories.length)
          continue;
  
        for (const catData of guildData.categories) {
          const category: CategoryChannel = this.bot.findChannel(guild, catData.catID) as CategoryChannel,
            joinChannel: VoiceChannel = this.bot.findChannel(guild, catData.channelID) as VoiceChannel;
  
          if (!category || !joinChannel) {

            if (!category && joinChannel)
              await joinChannel.delete();

            promises.push(await deleteCategory(this, guildData, catData.catID));
            continue;
          } else if (joinChannel && category && joinChannel.voiceMembers.size > 0) {
            const members = joinChannel.voiceMembers.map((m) => m.id);

            for (const m of members) {
              const member: Member = this.bot.findMember(guild, m) as Member;

              if (member) {
                promises.push(await create(this.bot, member, joinChannel));
                createdChannels++;
                continue;
              }
            }
          }
  
          if (!catData.channels.length)
            continue;
  
          for (const channelData of catData.channels) {
            const channel: VoiceChannel = this.bot.findChannel(guild, channelData.channelID) as VoiceChannel;
  
            if (!channel || (channel && channel.voiceMembers.size < 1)) {

              if (channel) await channel.delete();

              promises.push(await deleteChannel(this, guildData, catData, channelData.channelID));
              continue;
            }
          }
        }
      }
    }

    await Promise.all(promises);

    return `${deletedGuilds} Guilds Deleted. ${deletedChannels} Channels Deleted. ${createdChannels} Channels Created. ${failed} Failed Operations.`;

  }

  
  readonly checkVersion = async (newVersion: string): Promise<string> => {
    const data = await this.bot.getAllData(this.module.name) as VCModuleData[],
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
              categories: guildData.categories,
              defaultName: guildData.defaultName
            },
            newDataStruct = {
              version: newVersion,
              guildID: oldDataStruct.guildID,
              categories: oldDataStruct.categories,
              defaultName: oldDataStruct.defaultName
            };
      
          promises.push(await this.bot.updateModuleData(this.module.name, newDataStruct, guildData.guildID));
          break;
        }
        }
      }
    }

    await Promise.all(promises);

    return `${promises.length} Guild(s) Versions Migrated.`;
  }

}