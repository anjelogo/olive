import { Member } from "oceanic.js";
import Bot from "../../../main";

export const run = async (bot: Bot, member: Member, oldMember: ({ avatar: string } | null), communicationDisabledUntil?: number): Promise<void> => {

	console.log(communicationDisabledUntil);

	//TODO: Check if user is taken off of timeout and if they were on time out.

	//TODO: Check if user is being put on timeout and if they werent on timeout

};