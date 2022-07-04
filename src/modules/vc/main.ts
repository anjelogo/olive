import Module, { moduleDataStructure } from "../../Base/Module";
import Bot from "../../main";
import { Category } from "./internals/interfaces";

export interface moduleData extends moduleDataStructure {
	guildID: string;
	categories: Category[];
	defaultName: defaultName;
}

interface defaultName {
	category: string;
	channel: string;
}

export default class VC extends Module {

	readonly name: string;
	readonly version: string;
	readonly path: string;
	readonly db: boolean;

	constructor (bot: Bot) {
		super(bot);

		this.name = "VC";
		this.version = "1.1";
		this.path = "modules/vc";
		this.db = true;

	}

	public run = async (): Promise<void> => {
		await this.load();
	}

	readonly moduleData = {
		version: this.version,
		guildID: "",
		categories: [],
		defaultName: {
			category: "Join to create a channel",
			channel: "{user}'s channel"
		}
	}

}