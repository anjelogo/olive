import { Role, Uncached } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import { RolesModuleData } from "../../../Database/interfaces/RolesModuleData";

export const run = async (bot: ExtendedClient, role: Role | Uncached): Promise<void> => {

  if (!(role instanceof	Role)) return;
  if (!role.guild || !role) return;

  const data = await bot.getModuleData("Roles", { guildID: role.guild.id }) as RolesModuleData;

  if (data.messages) {
    const i = data.messages.findIndex((m) => m.roles.map((r) => r.role).includes(role.id));
    if (i > -1) data.messages.splice(i, 1);
	
    try {
      await bot.updateModuleData("Roles", data, { guildID: role.guild.id });
    } catch (e) {
      throw new Error("Error deleted role from db");
    }
  }

  if (data.autoRoles.includes(role.id)) {
    const index = data.autoRoles.indexOf(role.id);
    if (index > -1) data.autoRoles.splice(index, 1);

    try {
      await bot.updateModuleData("Roles", data, { guildID: role.guild.id });
    } catch (e) {
      throw new Error("Error deleted role from db");
    }
  }

  if (data.savedRoles.enabled) {
    const promises = [];
    for (const userData of data.savedRoles.roles) {
      if (userData.roles.includes(role.id)) {
        const index = userData.roles.indexOf(role.id);
        if (index > -1) userData.roles.splice(index, 1);
        promises.push(bot.updateModuleData("Roles", data, { guildID: role.guild.id }));
      }
    }

    try {
      await Promise.all(promises);
    } catch (e) {
      throw new Error("Error deleted role from db");
    }
  }
};