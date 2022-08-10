import { Category, Channel } from "../internals/interfaces";
import { Member, PrivateChannel, VoiceChannel } from "eris";
import { create } from "../internals/handler";
import Bot from "../../../main";
import { moduleData } from "../main";
import Logging from "../../logging/main";

export const run = async (bot: Bot, member: Member, channel: VoiceChannel): Promise<void> => {

	if (!channel.parentID) return;

	const data: moduleData = (await bot.getModuleData("VC", channel.guild) as unknown) as moduleData,
		cat: Category | undefined = data.categories.find((c: Category) => c.catID === channel.parentID);

	if (!cat) return;

	if (channel.id === cat.channelID) await create(bot, member, channel);
	
	const channelObj: Channel | undefined = cat.channels.find((c) => c.channelID === channel.id);

	if (channelObj) {
		if (await bot.getModule("Main").handlePermission(member, "vc.join")) {
			//get logging module
			const logging = await bot.getModule("Logging") as Logging;
			logging.log(channel.guild, "vc", {embeds: [{
				type: "rich",
				title: `${member.username}#${member.discriminator}`,
				description: `Joined \`${channel.name}\``,
				author: {
					name: "Joined Private Voice Channel",
					icon_url: member.avatarURL
				},
				color: bot.constants.config.colors.green,
				timestamp: new Date(),
				footer: {
					text: `ID: ${member.id}`
				}
			}]})
		}
		else 
			member.edit({ channelID: null });
	}
};