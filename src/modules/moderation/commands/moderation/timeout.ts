import { CommandInteraction, Constants, Guild, InteractionDataOptionsString, InteractionDataOptionsUser, Member, Message, Role } from "eris";
import Command from "../../../../Base/Command";
import Bot from "../../../../main";
import { autoCalculateInfractions, punish } from "../../internals/punishmentHandler";
import uniqid from "uniqid";
import { Case } from "../../main";

export default class Timeout extends Command {

    constructor(bot: Bot) {

        super(bot);

        this.commands = ["timeout"];
        this.example = "timeout @user being very mean";
        this.description = "Puts the user on Time out";
        this.permissions = ["moderation.punish.timeout", "moderation.punish.*"];
        this.options = [
            {
                name: "user",
                description: "The user to timeout",
                required: true,
                type: Constants.ApplicationCommandOptionTypes.USER,
            }, {
                name: "reason",
                description: "The reason for the timeout",
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
            interaction.createMessage({
                content: `${this.bot.constants.emojis.x} You must specify a user to timeout!`,
                flags: Constants.MessageFlags.EPHEMERAL
            })

        const userToTimeOut = this.bot.findMember(guild, value.value) as Member

        if (!userToTimeOut)
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
            userToTimeOutHighestRoleID = userToTimeOut.roles.length
                ? userToTimeOut.roles
                    .map((r) => 
                        ({
                            name: (this.bot.findRole(guild, r) as Role).name,
                            position: (this.bot.findRole(guild, r) as Role).position
                        }))
                    .sort((a, b) => b.position - a.position).map((r) => r.name)
                : [guild.id],
            userToTimeOutHighestRole = this.bot.findRole(guild, userToTimeOutHighestRoleID[0]) as Role;

        if (userToTimeOut.id === moderator.id)
            return interaction.createMessage({
                content: `${this.bot.constants.emojis.x} You can't time yourself out!`,
                flags: Constants.MessageFlags.EPHEMERAL
            })
        if (userToTimeOut.id === guild.ownerID)
            return interaction.createMessage({
                content: `${this.bot.constants.emojis.x} You can't time the server owner out!`,
                flags: Constants.MessageFlags.EPHEMERAL
            })
        if (userToTimeOutHighestRole.position > memberHighestRole.position)
            return interaction.createMessage({
                content: `${this.bot.constants.emojis.x} You can't put a user with a higher role than you on time out!`,
                flags: Constants.MessageFlags.EPHEMERAL
            })
        if (userToTimeOutHighestRole.position > botHighestRole.position)
            return interaction.createMessage({
                content: `${this.bot.constants.emojis.x} User has a role higher than the bot!`,
                flags: Constants.MessageFlags.EPHEMERAL
            })
        if (userToTimeOutHighestRole.position === botHighestRole.position)
            return interaction.createMessage({
                content: `${this.bot.constants.emojis.x} User has the same role as the bot!`,
                flags: Constants.MessageFlags.EPHEMERAL
            })
        
        const reason = ((interaction.data.options?.[1]) as InteractionDataOptionsString)?.value ?? "No reason given",
            time = interaction.data.options?.[2]?.value ?? "0d";

        //punish user using the punish function in ../../internals/punishmentHandler.ts
        let caseData: Case = {
            id: uniqid(),
            userID: userToTimeOut.id,
            moderatorID: moderator.id,
            action: "timeout",
            timestamp: new Date().toISOString()
        }

        if (reason) caseData.reason = reason;

        await punish(this.bot, guild, caseData);
        await autoCalculateInfractions(this.bot, userToTimeOut);

        return interaction.createMessage({
            content: `${this.bot.constants.emojis.check} Placed \`${userToTimeOut.username}#${userToTimeOut.discriminator}\` on Time Out for \`${reason}\``,
            flags: Constants.MessageFlags.EPHEMERAL
        })
    }

}