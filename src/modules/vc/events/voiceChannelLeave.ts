import { Member, VoiceChannel } from "oceanic.js";
import { remove } from "../internals/handler";
import ExtendedClient from "../../../Base/Client";

export const run = async (bot: ExtendedClient, member: Member, channel: VoiceChannel): Promise<void> => {

  await remove(bot, member, channel);

};