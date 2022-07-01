import { Channel, Embed, Guild, GuildChannel, TextChannel } from "eris";
import Module from "../../Base/Module";
import Bot from "../../main";

export type LogChannelTypes = ("welcome" | "vc" | "moderation");

export interface CaseLogDataStructure {
	channelID: string;
	messageID: string;
	caseID: string;
}

export interface LogChannelStructure {
    types: LogChannelTypes[];
    channelID: string;
	cases?: CaseLogDataStructure[];
}

export interface moduleData {
	guildID: string;
	channels: LogChannelStructure[]
}

export default class Logging extends Module {

	readonly name: string;
	readonly version: string;
	readonly path: string;
	readonly db: boolean;

	constructor (bot: Bot) {
		super(bot);

		this.name = "Logging";
		this.version = "1.0";
		this.path = "modules/logging";
		this.db = true;

	}

	public run = async (): Promise<void> => {
		await this.load();
	}

	readonly moduleData: moduleData = {
		guildID: "",
		channels: []
	}

	readonly log = async (guild: Guild, type: LogChannelTypes, embed: Embed, id?: string) => {
		const guildData = await this.bot.getModuleData(this.name, guild) as moduleData;

		if (!guildData) return;
		if (guildData.channels) {
			const channels = guildData.channels.filter((c) => c.types.includes(type));

			for (const c of channels) {
				const channel = this.bot.findChannel(guild, c.channelID) as TextChannel,
					message = await channel.createMessage({
						content: undefined,
						embeds: [embed]
				})

				if (type === "moderation") {
					c.cases ? c.cases.push({
						channelID: channel.id,
						messageID: message.id,
						caseID: id!!
					}) : c.cases = [{
						channelID: channel.id,
						messageID: message.id,
						caseID: id!!
					}]

					await this.bot.updateModuleData(this.name, guildData, guild);
				}
			}
		}
	}
}