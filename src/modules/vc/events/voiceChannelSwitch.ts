import { Category, Channel } from "../internals/interfaces";
import { Member, StageChannel, Uncached, VoiceChannel } from "oceanic.js";
import { create, remove } from "../internals/handler";
import ExtendedClient from "../../../Base/Client";
import { moduleData } from "../main";

export const run = async (bot: ExtendedClient, member: Member, channel: Uncached | VoiceChannel | StageChannel, oldChannel: null | VoiceChannel | StageChannel | Uncached): Promise<void> => {
	if (channel.id === null || channel instanceof StageChannel) return;

    const data: moduleData = (await bot.getModuleData("VC", (channel as VoiceChannel).guild.id) as unknown) as moduleData,
		  cat: Category | undefined = data.categories.find((c: Category) => c.catID === (channel as VoiceChannel).parentID);

	  if (!cat) return;

    if (oldChannel) await remove(bot, member, oldChannel as VoiceChannel | StageChannel);

    // weird hack
    // reasoning: voiceChannelSwitch keeps sending catID for newChannel, but not the actual channelID that the user moved to
    // solution: use the real member voiceState channelID
    const realChannel = bot.getChannel(member.voiceState?.channelID as string) as VoiceChannel;
    if (realChannel.id === cat.channelID) await create(bot, member, realChannel);
};