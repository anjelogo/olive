import { Guild, Member, User } from "oceanic.js";
import Bot from "../../../main";
import { moduleData } from "../main";

export const run = async (bot: Bot, guild: Guild, member: Member): Promise<void> => {

	const data: moduleData = await bot.getModuleData("Roles", guild) as moduleData;
    
	if (!member.roles.length) return;
	if (!data.savedRoles.enabled) return;

	data.savedRoles.roles.length ? data.savedRoles.roles : data.savedRoles.roles = [];

	const userData = data.savedRoles.roles.find((r) => r.userID === member.id);
	//Remove userData
	if (userData) 
		data.savedRoles.roles.splice(data.savedRoles.roles.indexOf(userData), 1);

	data.savedRoles.roles.push({ userID: member.id, roles: member.roles });

	await bot.updateModuleData("Roles", data, guild);
};