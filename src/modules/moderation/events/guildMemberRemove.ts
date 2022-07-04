import { Constants, Guild, Member, User } from "eris";
import Bot from "../../../main";
import { addCase, getCases } from "../internals/caseHandler";
import { createLogEntry } from "../internals/logHandler";
import { Case } from "../main";

export const run = async (bot: Bot, guild: Guild, member: Member | { id: string; user: User }): Promise<void> => {

    const Cases = await getCases(bot, guild, member.id),
    audit = await guild.getAuditLog({
        limit: 1,
        actionType: Constants.AuditLogActions.MEMBER_KICK
    })

    if (Cases.filter(c => c.id === audit.entries[0].id).length) return;

    const moderator = bot.findMember(guild, audit.entries[0].user?.id) as Member

    if (moderator.id === bot.user.id) return

    const reason = audit.entries[0].reason ?? undefined;

    const Case: Case = {
        id: audit.entries[0].id,
        userID: member.id,
        moderatorID: moderator.user.id,
        action: "kick",
        timestamp: new Date().toISOString(),
        reason
    };

    await createLogEntry(bot, guild, Case, member.user);
    await addCase(bot, guild, Case);

}