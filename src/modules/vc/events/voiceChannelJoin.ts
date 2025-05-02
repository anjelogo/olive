import { Category, Channel } from "../internals/interfaces";
import { Member, VoiceChannel } from "oceanic.js";
import { create, createLogEntry } from "../internals/handler";
import ExtendedClient from "../../../Base/Client";
import { moduleData } from "../main";
import Main from "../../main/main";

export const run = async (bot: ExtendedClient, member: Member, channel: VoiceChannel): Promise<void> => {

  if (!channel.parentID) return;

  const data: moduleData = (await bot.getModuleData("VC", channel.guild.id) as unknown) as moduleData,
    mainModule = bot.getModule("Main") as Main,
    cat: Category | undefined = data.categories.find((c: Category) => c.catID === channel.parentID);

  if (!cat) return;

  if (channel.id === cat.channelID) await create(bot, member, channel);

  const channelObj = cat.channels.find((c: Channel) => c.channelID === channel.id);

  if (channelObj) {
    if (await mainModule.handlePermission(member, "vc.join"))
      createLogEntry(bot, "join", channel, member);
    else 
      member.edit({ channelID: null });
  }
};