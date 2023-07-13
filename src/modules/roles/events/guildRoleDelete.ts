import { Guild, Role } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import { moduleData } from "../main";

export const run = async (bot: ExtendedClient, guild: Guild, role: Role): Promise<void> => {

	if (!guild || !role) return;

	const data: moduleData = await bot.getModuleData("Roles", guild.id) as moduleData;

	if (data.messages) {
		const i = data.messages.findIndex((m) => m.roles.map((r) => r.role).includes(role.id));
		if (i > -1) data.messages.splice(i, 1);
	
		try {
			await bot.updateModuleData("Roles", data, guild.id);
		} catch (e) {
			throw new Error("Error deleted role from db");
		}
	}
};