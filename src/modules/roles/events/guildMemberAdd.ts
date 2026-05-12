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
      // check if role exists
      const roleData = bot.findRole(member.guild, role);
      if (!roleData) continue;

      // skip if user already has role
      if (member.roles.includes(role)) continue;
      
      //skip paid/boost roles
      if (roleData.tags.premiumSubscriber) continue;
      if (roleData.tags.integrationID) continue;
      if (roleData.tags.botID) continue;
      if (roleData.tags.availableForPurchase) continue;

      promises.push(member.addRole(role));
    }

    try {
      await Promise.all(promises);
    } catch (e) {
      return;
    }
  }

  if (data.autoRoles.length > 0) {
    const promises = [];

    for (const role of data.autoRoles) {
      // check if role exists
      const roleData = bot.findRole(member.guild, role);
      if (!roleData) continue;

      // skip if user already has role
      if (member.roles.includes(role)) continue;

      //skip paid/boost roles
      if (roleData.tags.premiumSubscriber) continue;
      if (roleData.tags.integrationID) continue;
      if (roleData.tags.botID) continue;
      if (roleData.tags.availableForPurchase) continue;

      promises.push(member.addRole(role));
    }

    try {
      await Promise.all(promises);
    } catch (e) {
      return;
    }
  }

};