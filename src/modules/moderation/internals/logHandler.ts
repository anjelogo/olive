import { Guild, Member, User } from "eris"
import Bot from "../../../main"
import Logging, { moduleData } from "../../logging/main"
import { Case } from "../main"

export async function createLogEntry(bot: Bot, guild: Guild, data: Case, partialUser?: Partial<User>) {

    const actions = {
            warn: "Warned",
            kick: "Kicked",
            ban: "Banned",
            timeout: "Timed Out"
        },
        logging = await bot.getModule("Logging") as Logging,
        member = partialUser ?? bot.findMember(guild, data.userID) as Member,
        moderator = bot.findMember(guild, data.moderatorID) as Member,
        embed = {
            type: "rich",
            title: `User ${actions[data.action]}`,
            author: {
                name: member.username!!,
                icon_url: member.avatarURL
            },
            fields: [
                {
                    name: "Moderator",
                    value: moderator.mention,
                    inline: true
                }, {
                    name: "Punishment Duration",
                    value: ["ban", "timeout"].some((a) => a === data.action) ? (data.time ? `\`${bot.constants.utils.HMS(data.time)}\`` : "Permanent") : "No Duration",
                    inline: true
                }, {
                    name: "Reason",
                    value: data.reason ?? "No reason provided."
                }
            ],
            timestamp: data.timestamp,
            footer: {
                text: `Case ID: ${data.id}`
            },
            color: bot.constants.config.colors.red
        }

    logging.log(guild, "moderation", { embeds: [embed] }, { caseID: data.id });
}

export async function updateLogEntry(bot: Bot, guild: Guild, data: Case) {

    const guildData = await bot.getModuleData("Logging", guild) as moduleData;

    if (guildData.channels.filter((c) => c.types.includes("moderation")).length) {
        const moderationLogChannels = guildData.channels.filter((c) => c.types.includes("moderation") && c.cases);

        if (!moderationLogChannels.length) return;

        const channelsWithCases = moderationLogChannels.filter((c) => c.cases!!.find((c) => c.caseID === data.id));

        if (!channelsWithCases) return;

        const cases = channelsWithCases.map((c) => c.cases!!.find((c) => c.caseID === data.id));

        if (cases.length) {
            for (const Case of cases) {
                const message = await bot.getMessage(Case!!.channelID, Case!!.messageID);

                if (!message) continue;

                const oldEmbed = message.embeds[0],
                    moderator = bot.findMember(guild, data.moderatorID) as Member;

                await message.edit({
                    embeds: [
                        {
                            title: `${oldEmbed.title} (Resolved)`,
                            color: bot.constants.config.colors.green,
                            author: oldEmbed.author,
                            fields: [
                                {
                                    name: "Moderator",
                                    value: `~~${oldEmbed.fields!![0].value}~~\n${moderator.mention}`,
                                    inline: true
                                }, {
                                    name: "Punishment Duration",
                                    value: `~~${oldEmbed.fields!![1].value}~~\nResolved`,
                                    inline: true
                                }, {
                                    name: "Reason",
                                    value: `~~${oldEmbed.fields!![2].value}~~\n${data.resolved!!.reason}`
                                }
                            ],
                            footer: oldEmbed.footer,
                            timestamp: oldEmbed.timestamp
                        }
                    ]
                })
            }
        }

    }

}