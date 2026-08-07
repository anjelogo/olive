import { Guild } from "oceanic.js";
import ExtendedClient from "../../Base/Client";
import { ModmailModuleData } from "../../Database/interfaces/ModmailModuleData";
import Modmail from "./main";

export default class Checks {

	readonly bot: ExtendedClient;
	readonly module: Modmail;

	constructor(bot: ExtendedClient, Module: Modmail) {
		this.bot = bot;
		this.module = Module;
	}

	readonly run = async (): Promise<string> => {
		const data = await this.bot.getAllData("Modmail") as ModmailModuleData[],
			promises = [];

		let deletedGuilds = 0,
			deletedTickets = 0,
			failed = 0;

		async function deleteGuild(checks: Checks, guild: string) {
			if (!guild) return;

			try {
				await checks.bot.db.get("Modmail").findOneAndDelete({ guildID: guild });
				deletedGuilds++;
			} catch (e) {
				failed++;
			}
		}

		async function pruneTicket(checks: Checks, guildData: ModmailModuleData, channelID: string) {
			const i = guildData.openTickets.findIndex((t) => t.channelID === channelID);
			if (i > -1) guildData.openTickets.splice(i, 1);

			try {
				await checks.bot.updateModuleData("Modmail", { openTickets: guildData.openTickets }, { guildID: guildData.guildID });
				deletedTickets++;
			} catch (e) {
				failed++;
			}
		}

		if (data.length) {
			for (const guildData of data) {
				const guild: Guild = this.bot.findGuild(guildData.guildID) as Guild;

				if (!guild) {
					promises.push(await deleteGuild(this, guildData.guildID));
					continue;
				}

				if (!guildData.openTickets.length) continue;

				for (const ticket of guildData.openTickets) {
					const channel = this.bot.findChannel(guild, ticket.channelID);

					if (!channel) promises.push(await pruneTicket(this, guildData, ticket.channelID));
				}
			}
		}

		await Promise.all(promises);

		return `${deletedGuilds} Guilds Deleted. ${deletedTickets} Stale Tickets Pruned. ${failed} Failed Operations.`;
	}

}
