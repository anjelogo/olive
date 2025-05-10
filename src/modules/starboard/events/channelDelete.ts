import { TextChannel } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import { StarboardModuleData } from "../../../Database/interfaces/StarboardModuleData";

export const run = async (bot: ExtendedClient, channel: TextChannel) => {
  const StarboardData = await bot.getModuleData("Starboard", channel.guild.id) as StarboardModuleData;

  if (!StarboardData.messages) return;
    
  const channelObj = StarboardData.messages.find((m) => m.channelID === channel.id);
  if (!channelObj) return;

  StarboardData.messages = StarboardData.messages.filter((m) => m.channelID !== channel.id);

  try {
    await bot.updateModuleData("Starboard", StarboardData, channel.guild.id);
  } catch (e) {
    throw new Error("Could not update starboard data");
  }
};