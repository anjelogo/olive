import Eris from "eris";
import Bot from "../main";
import { Constants } from "../resources/interfaces";
import ApplicationCommandManager from "./Application/ApplicationCommandManager";
import ComponentManager from "./Application/ComponentManger";
import FollowupManager from "./Application/FollowupManager";
import { ApplicationCommandOptionChoice } from "./Application/types";

export interface Options {
	name: string;
	type: number; //https://discord.com/developers/docs/interactions/slash-commands#data-models-and-types
	description: string;
	required?: boolean;
	choices?: ApplicationCommandOptionChoice[];
	permissions?: string[];
	requirePerms?: string[];
	options?: Options[];
}

export default class Command {

	public disabled = false;
	public commands: string[];
	public description: string;
	public example: string;
	public enabled: boolean;
	public devOnly: boolean;
	public category: string;
	public permissions?: string[];
	public requirePerms?: keyof typeof Eris.Constants.Permissions;
	public options?: Options[];
	public bot: Bot;
	public constants: Constants;
	public guildSpecific?: string[];
	public execute: (interaction: ApplicationCommandManager) => Promise<ApplicationCommandManager | FollowupManager | undefined> | undefined;
	public update: (component: ComponentManager) => Promise<ApplicationCommandManager | FollowupManager | undefined> | undefined;

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