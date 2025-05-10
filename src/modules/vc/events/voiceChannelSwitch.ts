import { Member, StageChannel, Uncached, VoiceChannel } from "oceanic.js";
import { create, createLogEntry, remove } from "../internals/handler";
import ExtendedClient from "../../../Base/Client";
import Main from "../../main/main";
import { VCModuleData } from "../../../Database/interfaces/VCModuleData";

export const run = async (bot: ExtendedClient, member: Member, channel: Uncached | VoiceChannel | StageChannel, oldChannel: null | VoiceChannel | StageChannel | Uncached): Promise<void> => {
  if (channel.id === null || channel instanceof StageChannel) return;

  const data = await bot.getModuleData("VC", member.guild.id) as VCModuleData,
    mainModule = bot.getModule("Main") as Main,
    cat = data.categories.find((c) => c.catID === (channel as VoiceChannel).parentID);

  if (!cat) return;

  if (oldChannel) await remove(bot, member, oldChannel as VoiceChannel | StageChannel);

  // weird hack
  // reasoning: voiceChannelSwitch keeps sending catID for newChannel, but not the actual channelID that the user moved to
  // solution: use the real member voiceState channelID
  const realChannel = bot.getChannel(member.voiceState?.channelID as string) as VoiceChannel;
  if (realChannel.id === cat.channelID) await create(bot, member, realChannel);

  const channelObj = cat.channels.find((c) => c.channelID === realChannel.id);
  
  if (channelObj) {
    if (await mainModule.handlePermission(member, "vc.join"))
      await createLogEntry(bot, "join", channel as VoiceChannel, member);
    else 
      member.edit({ channelID: null });
  }
};