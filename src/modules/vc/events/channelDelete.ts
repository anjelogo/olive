import { Constants, GuildChannel } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import { VCModuleData } from "../../../Database/interfaces/VCModuleData";

export const run = async (bot: ExtendedClient, channel: (GuildChannel)): Promise<void> => {
  if ([Constants.ChannelTypes.GUILD_TEXT, Constants.ChannelTypes.GUILD_ANNOUNCEMENT, Constants.ChannelTypes.GUILD_FORUM].includes(channel.type)) return;

  const data = await bot.getModuleData("VC", channel.guildID) as VCModuleData;

  async function deleteCategory(guildData: VCModuleData, channel: string) {
    if (!guildData) return;
  
    const i = guildData.categories.findIndex((c) => c.catID === channel);
    if (i > -1) guildData.categories.splice(i, 1);

    try {
      await bot.updateModuleData("VC", guildData, guildData.guildID);
    } catch (e) {
      throw new Error("Could not delete channel!");
    }
  }

  if (channel.type === Constants.ChannelTypes.GUILD_CATEGORY) {
    const catData = data.categories.find((c) => c.catID === channel.id);
    
    if (catData)
      await deleteCategory(data, catData.catID);
  }

  if (channel.type === Constants.ChannelTypes.GUILD_VOICE) {
    const catData = data.categories.find((c) => c.channelID === channel.id);
    
    if (catData)
      await deleteCategory(data, catData.catID);
  }
};