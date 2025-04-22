import { Constants, Guild, Member, User } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import { getCases, resolveCase } from "../internals/caseHandler";

export const run = async (bot: ExtendedClient, guild: Guild, user: User): Promise<void> => {
    
	const Cases = await getCases(bot, guild, user.id),
		audit = await guild.getAuditLog({
			limit: 1,
			actionType: Constants.AuditLogActionTypes.MEMBER_BAN_ADD
		}),
		moderator = bot.findMember(guild, audit.entries[0].user?.id) as Member;

	if (!Cases.filter(c => c.action === "ban" && !c.resolved).length) return;

	if (moderator.id === bot.user.id) return;

	const Case = Cases.filter(c => c.id === audit.entries[0].id)[0];

	await resolveCase(bot, guild, Case.id, moderator.id, "No Reason Provided");

};