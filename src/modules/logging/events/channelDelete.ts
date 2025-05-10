import { Constants, TextChannel } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import { VCModuleData } from "../../../Database/interfaces/VCModuleData";

export const run = async (bot: ExtendedClient, channel: (TextChannel)): Promise<void> => {
  if (![Constants.ChannelTypes.GUILD_VOICE, Constants.ChannelTypes.GUILD_STAGE_VOICE].includes(channel.type)) return;

  const data = await bot.getModuleData("VC", channel.guildID) as VCModuleData;

  if (!data) return;

  async function deleteChannel(guildData: VCModuleData, channel: string) {
    if (!guildData) return;

    const category = guildData.categories.find((c) => c.channels.some((ch) => ch.channelID === channel));

    category?.channels.filter((ch) => ch.channelID !== channel);

    try {
      await bot.updateModuleData("VC", guildData, guildData.guildID);
    } catch (e) {
      throw new Error("Could not delete channel!");
    }
  }

  await deleteChannel(data, channel.id);
  return;
};