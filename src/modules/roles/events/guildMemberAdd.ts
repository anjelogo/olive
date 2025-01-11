import { Guild, Member } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import { moduleData } from "../main";

export const run = async (bot: ExtendedClient, member: Member): Promise<void> => {
	
	const data: moduleData = await bot.getModuleData("Roles", member.guild.id) as moduleData;

	if (data.savedRoles.enabled) {
		const userData = data.savedRoles.roles.find((r) => r.userID === member.id);

		if (!userData) return;

		for (const role of userData.roles) {
			try {
				await member.addRole(role);
			} catch (e) {
				return console.error(e);
			}
		}
	}

	for (const rid of data.autoRoles) {
		const role = bot.findRole(member.guild, rid);

		if (!role) continue;
		
		try {
			await member.addRole(rid);
		} catch (e) {
			return;
		}
	}

};