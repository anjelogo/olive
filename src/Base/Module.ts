/* eslint-disable @typescript-eslint/no-var-requires */

import { Permnodes, Constants } from "../resources/interfaces";
import { promises as fs } from "fs";
import Bot from "../main";
import Command from "./Command";
import { Guild } from "eris";

export interface moduleDataStructure {
	version: string;
	guildID: string;
}

export default class Module {

	readonly name: string;
	readonly version: string;
	readonly bot: Bot;
	readonly constants: Constants;
	readonly path: string;
	readonly weight: number;
	readonly db?: boolean;
	readonly moduleData: unknown;

	constructor (bot: Bot) {

		this.name = "";
		this.version = "0.0";
		this.bot = bot;
		this.constants = bot.constants;
		this.path = "";
		this.weight = 2; //Loads AFTER Main module | Should go as follows: Main Module => Dependencies => Modules => Sub Modules
		this.db = false;

	}

	readonly data = async (guild: string | Guild): Promise<unknown> => {
		if (!this.db || !guild) return;

		if (typeof guild === "string") guild = this.bot.findGuild(guild) as Guild;

		if (!guild) return;

		let data = await this.bot.db.get(this.name).findOne({ guildID: guild.id });
		if (!data) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(this.moduleData as any).guildID = guild.id;

			this.bot.constants.utils.log(this.name, `Module data not found for guild "${guild.name}". Creating now...`);
			await this.bot.db.get(this.name).insert(this.moduleData);
			this.bot.constants.utils.log(this.name, `Module data created for guild "${guild.name}".`);
		}

		data = await this.bot.db.get(this.name).findOne({ guildID: guild.id });

		return data;
	}

	public async load(): Promise<void> {

		this.constants.utils.log(this.name, "Loading...");

		//Load Commands
		const Categories = await fs.readdir(`./${this.path}/commands`, { withFileTypes: true });

		for (const Cat of Categories) {

			if (!Cat.isDirectory()) return;

			const Category: string = Cat.name,
				Commands = await fs.readdir(`./${this.path}/commands/${Category}`);

			Commands.forEach(Command => {

				const cObj: Command = new (require(`../${this.path}/commands/${Category}/${Command}`).default)(this.bot);
				cObj.category = Category;

				this.bot.commands.push(cObj);

			});
		}

		//Load Perms
		const permissions = await require(`../${this.path}/permnodes`).default;
		permissions.forEach((permission: Permnodes) => {
			this.bot.perms.push(permission);
		});
		
		//Load Events
		const Events = await fs.readdir(`./${this.path}/events`, { withFileTypes: true }); 
		for (const e of Events) {
			const event: string = e.name.replace(/\..*/g, "");

			this.bot.events.find(e => e.name === event)
				? this.bot.events.find(e => e.name === event).functions.push(require(`../${this.path}/events/${e.name}`))
				: this.bot.events.push({ name: event, functions: [require(`../${this.path}/events/${e.name}`)] });
		}

		this.constants.utils.log(this.name, "Loaded.");

	}

}