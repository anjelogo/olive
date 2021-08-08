import { Guild } from "eris";
import Bot from "../../../main";

export const run = async (bot: Bot, guild: Guild): Promise<void> => {
	async function deleteGuild(guild: string) {
		if (!guild) return;

		try {
			await bot.db.get("VC").findOneAndDelete({ guildID: guild });
		} catch (e) {
			throw new Error("Could not delete data");
		}
	}

	await deleteGuild(guild.id);
};