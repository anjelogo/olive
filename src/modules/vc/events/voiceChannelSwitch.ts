import { Category, Channel } from "../internals/interfaces";
import { Member, PrivateChannel, VoiceChannel } from "eris";
import { create, remove } from "../internals/handler";
import Bot from "../../../main";
import { moduleData } from "../main";
import Logging from "../../logging/main";

export const run = async (bot: Bot, member: Member, newChannel: VoiceChannel, oldChannel: VoiceChannel): Promise<void> => {

	if (!newChannel.parentID) return;

	const data: moduleData = (await bot.getModuleData("VC", newChannel.guild) as unknown) as moduleData,
		cat: Category | undefined = data.categories.find((c: Category) => c.catID === newChannel.parentID);

	if (!cat) return;

	if (newChannel.id === cat.channelID) await create(bot, member, newChannel);

	const channelObj: Channel | undefined = cat.channels.find((c) => c.channelID === newChannel.id);

	if (channelObj) {

		if (await bot.getModule("Main").handlePermission(member, "vc.join")) {
			const logging = await bot.getModule("Logging") as Logging;
			logging.log(newChannel.guild, "vc", {
				type: "rich",
				title: `${member.username}#${member.discriminator}`,
				description: `Joined \`${newChannel.name}\``,
				author: {
					name: "Joined Private Voice Channel",
					icon_url: member.avatarURL
				},
				color: bot.constants.config.colors.green,
				timestamp: new Date(),
				footer: {
					text: `ID: ${member.id}`
				}
			})
		}
		else
			member.edit({ channelID: null });
	}

	await remove(bot, member, oldChannel);

};