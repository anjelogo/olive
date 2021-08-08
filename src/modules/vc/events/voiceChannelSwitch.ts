import { Category, Channel } from "../internals/interfaces";
import { Member, PrivateChannel, VoiceChannel } from "eris";
import { create, remove } from "../internals/handler";
import Bot from "../../../main";
import { moduleData } from "../main";

export const run = async (bot: Bot, member: Member, newChannel: VoiceChannel, oldChannel: VoiceChannel): Promise<void> => {

	if (!newChannel.parentID) return;

	const data: moduleData = (await bot.getModuleData("VC", newChannel.guild) as unknown) as moduleData,
		cat: Category | undefined = data.categories.find((c: Category) => c.catID === newChannel.parentID);

	if (!cat) return;

	if (newChannel.id === cat.channelID) await create(bot, member, newChannel);

	const channelObj: Channel | undefined = cat.channels.find((c) => c.channelID === newChannel.id);

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

	await remove(bot, member, oldChannel);

};