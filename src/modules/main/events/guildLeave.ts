import { Guild } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";

export const run = async (bot: ExtendedClient, guild: Guild): Promise<void> => {
	async function deleteGuild(guild: string) {
		if (!guild) return;

		// TODO: Create a new function to delete guild data
		// try {
		// 	await bot.db.get("Main").findOneAndDelete({ guildID: guild });
		// } catch (e) {
		// 	throw new Error("Could not delete data");
		// }
	}

	await deleteGuild(guild.id);
};