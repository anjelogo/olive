import { JSONMember, Member } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";

export const run = async (bot: ExtendedClient, member: Member, oldMember: null | JSONMember): Promise<void> => {

  console.log(oldMember?.communicationDisabledUntil);

  //TODO: Check if user is taken off of timeout and if they were on time out.

  //TODO: Check if user is being put on timeout and if they werent on timeout

};