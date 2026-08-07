import Module from "../../Base/Module";
import ExtendedClient from "../../Base/Client";
import { ModmailModuleData } from "../../Database/interfaces/ModmailModuleData";

export default class Modmail extends Module<"guild"> {
	readonly name = "Modmail";
	readonly version: string;
	readonly path: string;
	readonly db: boolean;

	constructor(bot: ExtendedClient) {
		super(bot);

		this.version = "1.0";
		this.path = "modules/modmail";
		this.db = true;
	}

	readonly moduleData: ModmailModuleData = {
		enabled: true,
		version: this.version,
		guildID: "",
		entryChannelID: "",
		categoryID: "",
		logChannelID: "",
		ticketLimit: 1,
		openTickets: [],
		blockedUserIDs: []
	};
}
