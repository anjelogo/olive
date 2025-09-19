import { Member } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import { RolesModuleData } from "../../../Database/interfaces/RolesModuleData";

export const run = async (bot: ExtendedClient, member: Member): Promise<void> => {
  
  const data = await bot.getModuleData("Roles", { guildID: member.guild.id }) as RolesModuleData;

  if (data.savedRoles.enabled) {
    const userData = data.savedRoles.roles.find((r) => r.userID === member.id);

    const promises = [];

    if (!userData) return;

    for (const role of userData.roles) {
      promises.push(member.addRole(role));
    }

    try {
      await Promise.all(promises);
    } catch (e) {
      return;
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