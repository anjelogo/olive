import { CommandInteraction, Constants, Guild, InteractionDataOptionsString, InteractionDataOptionsUser, Member, Message, Role } from "eris";
import Command from "../../../../Base/Command";
import Bot from "../../../../main";
import { autoCalculateInfractions, punish } from "../../internals/punishmentHandler";
import uniqid from "uniqid";
import { Case } from "../../main";

export default class Warn extends Command {

    constructor(bot: Bot) {

        super(bot);

        this.commands = ["warn"];
        this.example = "warn @user being very mean";
        this.description = "warns a user from the server";
        this.permissions = ["moderation.punish.warn", "moderation.punish.*"];
        this.options = [
            {
                name: "user",
                description: "The user to warn",
                required: true,
                type: Constants.ApplicationCommandOptionTypes.USER,
            }, {
                name: "reason",
                description: "The reason for the warn",
                required: false,
                type: Constants.ApplicationCommandOptionTypes.STRING,
            }
        ]

    }

    readonly execute = async (interaction: CommandInteraction): Promise<Message | void> => {
        await interaction.defer(Constants.MessageFlags.EPHEMERAL);

        const guild = this.bot.findGuild(interaction.guildID!!) as Guild,
            moderator = interaction.member!!,
            value = interaction.data.options?.[0] as InteractionDataOptionsUser;

        if (!value)
            return interaction.createMessage({
                content: `${this.bot.constants.emojis.x} You must specify a user to warn!`,
                flags: Constants.MessageFlags.EPHEMERAL
            })

        const userToWarn = this.bot.findMember(guild, value.value) as Member

        if (!userToWarn)
            return interaction.createMessage({
            content: `${this.bot.constants.emojis.x} I couldn't find that user!`,
            flags: Constants.MessageFlags.EPHEMERAL
        })

        const botMember = this.bot.findMember(guild, this.bot.user.id) as Member,
            botHighestRoleID = botMember.roles
                .map((r) => 
                    ({
                        name: (this.bot.findRole(guild, r) as Role).name,
                        position: (this.bot.findRole(guild, r) as Role).position
                    }))
                .sort((a, b) => b.position - a.position).map((r) => r.name),
            botHighestRole = this.bot.findRole(guild, botHighestRoleID[0]) as Role,
            memberHighestRoleID = moderator.roles.length
                ? moderator.roles
                    .map((r) => 
                        ({
                            name: (this.bot.findRole(guild, r) as Role).name,
                            position: (this.bot.findRole(guild, r) as Role).position
                        }))
                    .sort((a, b) => b.position - a.position).map((r) => r.name)
                : [guild.id],
            memberHighestRole = this.bot.findRole(guild, memberHighestRoleID[0]) as Role,
            userToWarnHighestRoleID = userToWarn.roles.length
                ? userToWarn.roles
                    .map((r) => 
                        ({
                            name: (this.bot.findRole(guild, r) as Role).name,
                            position: (this.bot.findRole(guild, r) as Role).position
                        }))
                    .sort((a, b) => b.position - a.position).map((r) => r.name)
                : [guild.id],
            userToWarnHighestRole = this.bot.findRole(guild, userToWarnHighestRoleID[0]) as Role;

        if (userToWarn.id === moderator.id)
            return interaction.createMessage({
                content: `${this.bot.constants.emojis.x} You can't warn yourself!`,
                flags: Constants.MessageFlags.EPHEMERAL
            })
        if (userToWarn.id === guild.ownerID)
            return interaction.createMessage({
                content: `${this.bot.constants.emojis.x} You can't warn the server owner!`,
                flags: Constants.MessageFlags.EPHEMERAL
            })
        if (userToWarnHighestRole.position > memberHighestRole.position)
            return interaction.createMessage({
                content: `${this.bot.constants.emojis.x} You can't warn a user with a higher role than you!`,
                flags: Constants.MessageFlags.EPHEMERAL
            })
        if (userToWarnHighestRole.position > botHighestRole.position)
            return interaction.createMessage({
                content: `${this.bot.constants.emojis.x} User has a role higher than the bot!`,
                flags: Constants.MessageFlags.EPHEMERAL
            })
        if (userToWarnHighestRole.position === botHighestRole.position)
            return interaction.createMessage({
                content: `${this.bot.constants.emojis.x} User has the same role as the bot!`,
                flags: Constants.MessageFlags.EPHEMERAL
            })
        
        const reason = ((interaction.data.options?.[1]) as InteractionDataOptionsString)?.value ?? "No reason given",
            time = interaction.data.options?.[2]?.value ?? "0d";

        //punish user using the punish function in ../../internals/punishmentHandler.ts
        let caseData: Case = {
            id: uniqid(),
            userID: userToWarn.id,
            moderatorID: moderator.id,
            action: "warn",
            timestamp: new Date().toISOString()
        }

        if (reason) caseData.reason = reason;

        await punish(this.bot, guild, caseData);
        await autoCalculateInfractions(this.bot, userToWarn);

        return interaction.createMessage({
            content: `${this.bot.constants.emojis.check} Warned \`${userToWarn.username}#${userToWarn.discriminator}\` for \`${reason}\``,
            flags: Constants.MessageFlags.EPHEMERAL
        })
    }

}