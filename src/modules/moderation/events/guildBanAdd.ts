import { Constants, Guild, Member, User } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import { addCase, generateCase, getCases } from "../internals/caseHandler";
import { createLogEntry } from "../internals/logHandler";

export const run = async (bot: ExtendedClient, guild: Guild, user: User): Promise<void> => {
    
  if (!guild) return;

  const audit = await guild.getAuditLog({
    limit: 1,
    actionType: Constants.AuditLogActionTypes.MEMBER_BAN_ADD
  });

  if (!audit.entries.length) return;
  if (audit.users.length <= 1) return;

  const moderator = bot.findMember(guild, audit.entries[0].user?.id) as Member;
  if (!moderator) return;

  // get user id from audit log
  const Cases = await getCases(bot, guild, audit.users[1].id);

  if (Cases.filter(c => c.action === "ban" && !c.resolved).length) return;

  if (moderator.id === bot.user.id) return;

  const reason = audit.entries[0].reason ?? undefined;

  const Case = generateCase("ban", user.id, moderator.id, null, reason);

  await createLogEntry(bot, guild, Case, user);
  await addCase(bot, guild, Case);

};