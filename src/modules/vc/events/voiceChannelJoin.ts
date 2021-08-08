import { Category, Channel } from "../internals/interfaces";
import { Member, PrivateChannel, VoiceChannel } from "eris";
import { create } from "../internals/handler";
import Bot from "../../../main";
import { moduleData } from "../main";

export const run = async (bot: Bot, member: Member, channel: VoiceChannel): Promise<void> => {

	if (!channel.parentID) return;

	const data: moduleData = (await bot.getModuleData("VC", channel.guild) as unknown) as moduleData,
		cat: Category | undefined = data.categories.find((c: Category) => c.catID === channel.parentID);

	if (!cat) return;

	if (channel.id === cat.channelID) await create(bot, member, channel);
	
	const channelObj: Channel | undefined = cat.channels.find((c) => c.channelID === channel.id);

	if (channelObj) {
		const dmChannel: PrivateChannel | undefined = await bot.getDMChannel(member.id);

		if (!await bot.getModule("Main").handlePermission(member, "vc.join")) {
			if (dmChannel) {
				try {
					member.edit({ channelID: null });
				} catch (e) {
					return;
				}
			}
		}
	}
};