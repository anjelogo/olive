import { Constants, Guild, Member, User } from "oceanic.js";
import Bot from "../../../main";
import { addCase, getCases } from "../internals/caseHandler";
import { createLogEntry } from "../internals/logHandler";
import { Case } from "../main";

export const run = async (bot: Bot, guild: Guild, user: User): Promise<void> => {
    
	const Cases = await getCases(bot, guild, user.id),
		audit = await guild.getAuditLog({
			limit: 1,
			actionType: Constants.AuditLogActionTypes.MEMBER_BAN_ADD
		}),
		moderator = bot.findMember(guild, audit.entries[0].user?.id) as Member;

	if (Cases.filter(c => c.action === "ban" && !c.resolved).length) return;

	if (moderator.id === bot.user.id) return;

	const reason = audit.entries[0].reason ?? undefined;

	const Case: Case = {
		id: audit.entries[0].id,
		userID: user.id,
		moderatorID: moderator.user.id,
		action: "ban",
		timestamp: new Date().toISOString(),
		reason
	};

	await createLogEntry(bot, guild, Case, user);
	await addCase(bot, guild, Case);

};