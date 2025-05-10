import { Message, TextChannel } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import Roles from "../main";
import { RolesMessage, RolesModuleData } from "../../../Database/interfaces/RolesModuleData";

export const run = async (bot: ExtendedClient, msg: (Message | { id: string; channel: unknown; })): Promise<void> => {

  if (!msg || (msg && !msg.id) || (msg && !(msg.channel as TextChannel).guild)) return;

  const data = await bot.getModuleData("Roles", (msg.channel as TextChannel).guild.id) as RolesModuleData,
    rolesModule = bot.getModule("Roles") as Roles,
    msgData = await rolesModule.getReactionMessage(msg.id, (msg.channel as TextChannel).guild.id) as RolesMessage;

  if (msgData) return;

  const i = data.messages.findIndex((m) => m.id === msg.id);
  if (i > -1) data.messages.splice(i, 1);
 
  try {
    await bot.updateModuleData("Roles", data, (msg.channel as TextChannel).guild.id);
  } catch (e) {
    throw new Error("Error deleted message from db");
  }
};