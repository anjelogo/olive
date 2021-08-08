import { remove } from "../internals/handler";
import { Member, VoiceChannel } from "eris";
import Bot from "../../../main";

export const run = async (bot: Bot, member: Member, channel: VoiceChannel): Promise<void> => {

	await remove(bot, member, channel);

};