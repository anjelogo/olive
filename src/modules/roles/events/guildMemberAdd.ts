import { Guild, Member } from "eris";
import Bot from "../../../main";
import { moduleData } from "../main";

export const run = async (bot: Bot, guild: Guild, member: Member): Promise<void> => {
	
	const data: moduleData = await bot.getModuleData("Roles", guild) as moduleData;

	if (data.savedRoles.enabled) {
		const userData = data.savedRoles.roles.find((r) => r.userID === member.id);
		
		if (!userData) return;

		for (const role of userData.roles) {
			try {
				await member.addRole(role);
			} catch (e) {
				return;
			}
		}
	}

	for (const rid of data.autoRoles) {
		const role = bot.findRole(guild, rid);

		if (!role) continue;
		
		try {
			await member.addRole(rid);
		} catch (e) {
			return;
		}
	}

};