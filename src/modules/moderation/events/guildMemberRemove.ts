import { Constants, Guild, Member, Uncached, User } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import { addCase, getCases } from "../internals/caseHandler";
import { createLogEntry } from "../internals/logHandler";
import { Case } from "../main";
import { autoCalculateInfractions } from "../internals/punishmentHandler";

export const run = async (bot: ExtendedClient, member: Member | User, guild: Guild | Uncached): Promise<void> => {

  guild = bot.findGuild(guild.id) as Guild;

  if (!guild) return;

  const user = member instanceof User ? member : member.user,
    Cases = await getCases(bot, guild as Guild, user.id),
    audit = await (guild as Guild).getAuditLog({
      limit: 1,
      actionType: Constants.AuditLogActionTypes.MEMBER_KICK
    });

  if (!audit.entries.length) return;

  if (Cases.filter(c => c.id === audit.entries[0].id).length) return;

  const timestamp = bot.constants.utils.convertSnowflake(audit.entries[0].id);

  if (Date.now() - timestamp.getTime() > 1000 * 30) return; // 1 minute

  const moderator = bot.findMember(guild as Guild, audit.entries[0].user?.id) as Member;

  if (moderator.id === bot.user.id) return;

  const reason = audit.entries[0].reason ?? undefined;

  const Case: Case = {
    id: audit.entries[0].id,
    userID: user.id,
    moderatorID: moderator.user.id,
    action: "kick",
    timestamp: new Date().toISOString(),
    reason
  };

  await createLogEntry(bot, guild as Guild, Case, user);
  await addCase(bot, guild as Guild, Case);
  await autoCalculateInfractions(bot, guild.id, user);

};