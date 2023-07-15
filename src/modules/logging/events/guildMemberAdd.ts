import { Guild, Member } from "oceanic.js";
import ExtendedClient  from "../../../Base/Client";
import Logging from "../main";

export const run = async (bot: ExtendedClient, member: Member): Promise<void> => {

	const logging = await bot.getModule("Logging") as Logging;

	logging.log(member.guild, "welcome", {embeds: [{
		type: "rich",
		title: `${member.username}`,
		description: "Joined the server",
		author: {
			name: "Joined Server",
			iconURL: member.avatarURL()
		},
		color: bot.constants.config.colors.green,
		timestamp: new Date().toDateString(),
		footer: {
			text: `ID: ${member.id}`
		}
	}]});

};