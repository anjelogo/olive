import { Guild, Member, Uncached, User } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import { RolesModuleData } from "../../../Database/interfaces/RolesModuleData";

export const run = async (bot: ExtendedClient, member: Member | User, guild: Guild | Uncached): Promise<void> => {

  if (member instanceof User) return;

  const data = await bot.getModuleData("Roles", guild.id) as RolesModuleData;
    
  if (!member.roles.length) return;
  if (!data.savedRoles.enabled) return;

  data.savedRoles.roles.length ? data.savedRoles.roles : data.savedRoles.roles = [];

  const userData = data.savedRoles.roles.find((r) => r.userID === member.id);
  //Remove userData
  if (userData) 
    data.savedRoles.roles.splice(data.savedRoles.roles.indexOf(userData), 1);

  const savedroles = member.roles;

  // get each role, check if it has tags, if it does, remove it from the array
  const guildObj = bot.findGuild(guild.id);
  if (!guildObj) return;

  const roles = guildObj.roles;
  const rolesToRemove = roles.filter(role => role.tags.premiumSubscriber && role.tags.guildConnections).map(role => role.id);
  const filteredRoles = savedroles.filter(role => !rolesToRemove.includes(role));


  data.savedRoles.roles.push({ userID: member.id, roles: filteredRoles });

  await bot.updateModuleData("Roles", data, member.guild);
};