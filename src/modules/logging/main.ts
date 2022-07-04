import { Channel, Embed, Guild, GuildChannel, TextChannel } from "eris";
import Module, { moduleDataStructure } from "../../Base/Module";
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

export interface moduleData extends moduleDataStructure {
	guildID: string;
	channels: LogChannelStructure[]
}

export default class Logging extends Module {

	readonly name: string;
	readonly version: string;
	readonly path: string;
	readonly weight: number;
	readonly db: boolean;

	constructor (bot: Bot) {
		super(bot);

		this.name = "Logging";
		this.version = "1.1";
		this.path = "modules/logging";
		this.weight = 1;
		this.db = true;

	}

	public run = async (): Promise<void> => {
		await this.load();
	}

	readonly moduleData = {
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