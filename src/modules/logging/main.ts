import { Channel, Embed, Guild, GuildChannel, TextChannel } from "eris";
import Module from "../../Base/Module";
import Bot from "../../main";

export type LogChannelTypes = ("welcome" | "vc")

export interface LogChannelStructure {
    types: LogChannelTypes[];
    channelID: string;
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

	readonly log = async (guild: Guild, type: LogChannelTypes, embed: Embed) => {
		const guildData = await this.bot.getModuleData(this.name, guild) as moduleData;

		if (!guildData) return;
		if (guildData.channels) {
			const channels = guildData.channels.filter((c) => c.types.includes(type));

			for (const c of channels) {
				const channel = this.bot.findChannel(guild, c.channelID) as TextChannel;

				channel.createMessage({
					content: undefined,
					embeds: [embed]
				})
			}
		}
	}
}