import { Member, VoiceChannel } from "oceanic.js";
import { create, createLogEntry } from "../internals/handler";
import ExtendedClient from "../../../Base/Client";
import Main from "../../main/main";
import { VCModuleData } from "../../../Database/interfaces/VCModuleData";

export const run = async (bot: ExtendedClient, member: Member, channel: VoiceChannel): Promise<void> => {

  if (!channel.parentID) return;

  const data = await bot.getModuleData("VC", member.guild.id) as VCModuleData,
    mainModule = bot.getModule("Main") as Main,
    cat = data.categories.find((c) => c.catID === channel.parentID);

  if (!cat) return;

  if (channel.id === cat.channelID) await create(bot, member, channel);

  const channelObj = cat.channels.find((c) => c.channelID === channel.id);

  if (channelObj) {
    if (await mainModule.handlePermission(member, "vc.join"))
      createLogEntry(bot, "join", channel, member);
    else 
      member.edit({ channelID: null });
  }
};