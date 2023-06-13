import { Constants, ApplicationCommandTypes, CommandInteraction, ComponentInteraction, Message, ApplicationCommandOptions } from "oceanic.js";
import Bot from "../main";
import { Constants as CustomConstants } from "../resources/interfaces";

export type Options =  ApplicationCommandOptions & {
	permissions?: string[];
	requirePerms?: string[];
	options?: Options[];
}

export default class Command {

	public type: (ApplicationCommandTypes | undefined);
	public disabled = false;
	public commands: string[];
	public description: string;
	public example: (string | null);
	public enabled: boolean;
	public devOnly: boolean;
	public category: string;
	public permissions?: string[];
	public requirePerms?: keyof typeof Constants.Permissions;
	public options?: Options[];
	public bot: Bot;
	public constants: CustomConstants;
	public guildSpecific?: string[];
	public execute: (interaction: CommandInteraction) => Promise<Message | undefined | void> | undefined;
	public update: (component: ComponentInteraction) => Promise<Message | undefined | void> | undefined;

	constructor(bot: Bot) {
		this.commands = [];
		this.description = "No Description Available :(";
		this.example = "No Example Available :(";
		this.enabled = true;
		this.devOnly = false;
		this.bot = bot;
		this.constants = bot.constants;
		this.category = "Uncategorized";

		this.execute = () => { return undefined; };
		this.update = () => { return undefined; };
	}

}