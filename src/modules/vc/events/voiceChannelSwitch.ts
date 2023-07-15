import { Category, Channel } from "../internals/interfaces";
import { Member, StageChannel, Uncached, VoiceChannel } from "oceanic.js";
import { create, remove } from "../internals/handler";
import ExtendedClient from "../../../Base/Client";
import { moduleData } from "../main";
import Logging from "../../logging/main";

export const run = async (bot: ExtendedClient, member: Member, newChannel: Uncached |  VoiceChannel | StageChannel, oldChannel: null | Uncached | VoiceChannel | StageChannel): Promise<void> => {

	if (!(newChannel instanceof VoiceChannel || newChannel instanceof StageChannel)) return;
	if (!(oldChannel instanceof VoiceChannel || oldChannel instanceof StageChannel)) return;

	if (!newChannel.parentID) return;

	const data: moduleData = (await bot.getModuleData("VC", newChannel.guild.id) as unknown) as moduleData,
		cat: Category | undefined = data.categories.find((c: Category) => c.catID === newChannel.parentID);

	if (!cat) return;

	//broken idk why will fix later
	//if (newChannel.id === cat.channelID) await create(bot, member, newChannel);

	const channelObj: Channel | undefined = cat.channels.find((c) => c.channelID === newChannel.id);

	if (channelObj) {

		if (await bot.getModule("Main").handlePermission(member, "vc.join")) {
			const logging = await bot.getModule("Logging") as Logging;
			logging.log(newChannel.guild, "vc", {embeds: [{
				type: "rich",
				title: `${member.tag}`,
				description: `Joined \`${newChannel.name}\``,
				author: {
					name: "Joined Private Voice Channel",
					iconURL: member.avatarURL()
				},
				color: bot.constants.config.colors.green,
				timestamp: new Date().toISOString(),
				footer: {
					text: `ID: ${member.id}`
				}
			}]});
		}
		else
			member.edit({ channelID: null });
	}

	if (oldChannel) 
		await remove(bot, member, oldChannel);

};