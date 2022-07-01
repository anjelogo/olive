import { Embed, Guild, Member } from "eris";
import Bot from "../../../main";
import { Case, CaseActionTypes, moduleData } from "../main";
import { addCase, getCases, resolveCase } from "./caseHandler";
import uniqid from "uniqid";
import { createLogEntry } from "./logHandler";

export async function punish(bot: Bot, guild: Guild, data: Case): Promise<void> {
    const action = {
            warn: "You were warned in {guild}.",
            timeout: "You have been put on timeout in {guild}.",
            kick: "You have been kicked from {guild}.",
            ban: "You have been banned from {guild}."
        },
        moderator = bot.findMember(guild, data.moderatorID) as Member,
        dmChannel = await bot.getDMChannel(data.userID),
        member = bot.findMember(guild, data.userID) as Member,
        reason = data.reason ?? "No reason provided.",
        embed: Embed = {
            type: "rich",
            title: action[data.action].replace("{guild}", guild.name),
            fields: [
                {
                    name: "Moderator",
                    value: moderator.mention,
                    inline: true
                }, {
                    name: "Punishment Duration",
                    value: data.time ? `\`${bot.constants.utils.HMS(data.time)}\`` : "Permanent",
                    inline: true
                }, {
                    name: "Reason",
                    value: reason
                }
            ]
        }

    try {
        await addCase(bot, guild, data)
        await createLogEntry(bot, guild, data)

        switch (data.action) {

        case "warn":
            dmChannel ? await dmChannel.createMessage({embeds: [embed]}) : null;
            break;
        case "timeout":
            dmChannel ? await dmChannel.createMessage({embeds: [embed]}) : null;
            member.edit({
                communicationDisabledUntil: new Date(data.time as string)
            })
            break;
        case "ban":
            dmChannel ? await dmChannel.createMessage({embeds: [embed]}) : null;
            guild.banMember(data.userID, undefined, reason);
            break;
        case "kick":
            dmChannel ? await dmChannel.createMessage({embeds: [embed]}) : null;
            guild.kickMember(data.userID, reason);
            break;
        }

    } catch (e) {
        throw new Error(e as string);
    }

}

export async function autoCalculateInfractions(bot: Bot, member: Member): Promise<void> {
    let history = await getCases(bot, member.guild, member.id),
        guildSettings = await bot.getModuleData("Moderation", member.guild) as moduleData,
        infractions = 0,
        punishment: CaseActionTypes | undefined,
        reason,
        hierarchy = {
            warn: 1,
            timeout: 2,
            kick: 2,
            ban: 3
        };

    if (history.filter(c => c.action === "ban").length) return;
    
    for (const Case of history) infractions += hierarchy[Case.action];

    if (infractions < guildSettings.settings.infractionUntilTimeout) return;
	if (infractions >= guildSettings.settings.infractionUntilTimeout && infractions < guildSettings.settings.infractionUntilBan) punishment = "timeout";
	else if (infractions >= guildSettings.settings.infractionUntilBan) punishment = "ban";

    if (!punishment) return;

    if (history.filter((c) => c.action === "timeout" && !c.resolved).length) {
        switch (punishment) {
        case "ban":
            await resolveCase(bot, member.guild, history.filter((c) => c.action === "timeout" && !c.resolved)[0].id, member.id, "[**AUTO-MOD**] Timeout removed for ban.");
            break;
        }
    }

    await punish(bot, member.guild, {
        id: uniqid(),
        userID: member.id,
        moderatorID: bot.user.id,
        action: punishment,
        reason,
        timestamp: new Date().toISOString(),
    });
}