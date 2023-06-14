import { Emoji, Guild } from "oceanic.js";
import Module, { moduleDataStructure } from "../../Base/Module";
import Bot from "../../main";

export interface SavedRolesStructure {
	userID: string;
	roles: string[];
}

export interface RolesMessage {
	id: string;
	channelID: string;
	roles: {
		role: string;
		emote: Partial<Emoji>;
	}[];
}

export interface moduleData extends moduleDataStructure {
	roles: string[];
	autoRoles: string[];
	messages: RolesMessage[];
	savedRoles: {
		enabled: boolean;
		roles: SavedRolesStructure[];
	};
}

export default class Roles extends Module {

	readonly name: string;
	readonly version: string;
	readonly path: string;
	readonly db: boolean;

	constructor(bot: Bot) {
		super(bot);

		this.name = "Roles";
		this.version = "1.1";
		this.path = "modules/roles";
		this.db = true;

	}

	public run = async (): Promise<void> => {
		await this.load();
	}

	readonly getReactionMessage = async (id: string, guild: string | Guild): Promise<RolesMessage | undefined> => {
		if (!id || !guild) return;

		if (typeof guild === "string") guild = this.bot.findGuild(guild) as Guild;

		const data: moduleData = await this.data(guild) as moduleData,
			messages = data.messages;

		if (!messages.length) return;

		return messages.find((m) => m.id === id);
	}

	readonly moduleData = {
		version: this.version,
		guildID: "",
		roles: [],
		autoRoles: [],
		messages: [],
		savedRoles: {
			enabled: false,
			roles: []
		}
	}

}