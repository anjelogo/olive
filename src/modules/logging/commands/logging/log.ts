import { ActionRow, CommandInteraction, ComponentInteraction, Constants, Embed, Guild, InteractionComponentSelectMenuData, InteractionDataOptionsSubCommand, Message, NewsChannel, TextChannel } from "eris";
import Command from "../../../../Base/Command";
import Bot from "../../../../main";
import { upsertCustomData, getCustomData } from "../../../main/internals/CustomDataHandler";
import { LogChannelStructure, LogChannelTypes, moduleData } from "../../main";

export interface CustomDataStructure {
    id: string,
    types: LogChannelTypes[]
}

export default class Log extends Command {

    constructor(bot: Bot) {

        super(bot);

        this.commands = ["log"];
        this.description = "Create log channels"
        this.example = "log create"
        this.options = [
            {
                type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                name: "create",
                description: "Create a log channel",
                permissions: ["logging.channel.create"]
            }, {
                type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                name: "delete",
                description: "Delete a log channel",
                permissions: ["logging.channel.delete"]
            }
        ]

    }

    private typesAvailable = async (bot: Bot, interaction: (CommandInteraction | ComponentInteraction)) => {
        const customData = getCustomData(bot, interaction instanceof CommandInteraction ? interaction.id : interaction.message.interaction?.id!!)?.data!! as CustomDataStructure,
            validTypes: LogChannelTypes[] = ["vc", "welcome"];

        return validTypes.filter(t => !customData.types.includes(t));
    }

    private create = (bot: Bot, interaction: (CommandInteraction | ComponentInteraction)) => {
        const customData = getCustomData(bot, interaction instanceof CommandInteraction ? interaction.id : interaction.message.interaction?.id!!)?.data!! as CustomDataStructure,
            embed: Embed = {
                type: "rich",
                title: "Log Channel Information",
                color: this.bot.constants.config.colors.default,
                fields: [
                    {
                        name: "Currently Logging",
                        value: customData.types.length ? customData.types.map(t => `\`${t}\``).join(", ") : "None"
                    }
                ],
                footer: {
                    text: interaction.channel.id
                }
            }

        return embed;
    }

    private components = async (bot: Bot, interaction: (CommandInteraction | ComponentInteraction)):
    Promise<
        {
            home: ActionRow[],
            addLog: ActionRow[],
            deleteLog: ActionRow[]
        }
    > => {
        const customData = getCustomData(bot, interaction instanceof CommandInteraction ? interaction.id : interaction.message.interaction?.id!!)?.data!! as CustomDataStructure;

        return {
            home: [
                {
                    type: Constants.ComponentTypes.ACTION_ROW,
                    components: [
                        {
                            type: Constants.ComponentTypes.BUTTON,
                            style: Constants.ButtonStyles.PRIMARY,
                            label: "Add Log",
                            disabled: !(await this.typesAvailable(this.bot, interaction)).length,
                            custom_id: `log_${interaction.member?.id}_addlog`
                        }, {
                            type: Constants.ComponentTypes.BUTTON,
                            style: Constants.ButtonStyles.SECONDARY,
                            label: "Remove Log",
                            disabled: (await this.typesAvailable(this.bot, interaction)).length > 1,
                            custom_id: `log_${interaction.member?.id}_removelog`
                        }, {
                            type: Constants.ComponentTypes.BUTTON,
                            style: Constants.ButtonStyles.SUCCESS,
                            label: "Save",
                            custom_id: `log_${interaction.member?.id}_save`
                        }, {
                            type: Constants.ComponentTypes.BUTTON,
                            style: Constants.ButtonStyles.DANGER,
                            label: "Cancel",
                            custom_id: `log_${interaction.member?.id}_cancel`
                        }
                    ]
                }
            ],
            addLog: [
                {
                    type: Constants.ComponentTypes.ACTION_ROW,
                    components: [
                        {
                            type: Constants.ComponentTypes.SELECT_MENU,
                            placeholder: "Select a logging type",
                            custom_id: `log_${interaction.member?.id}_addlogtype`,
                            max_values: 2,
                            min_values: 1,
                            options: (await this.typesAvailable(this.bot, interaction)).map((t) => ({ label: t, value: t}) )
                        }
                    ]
                }, {
					type: Constants.ComponentTypes.ACTION_ROW,
					components: [
						{
							type: Constants.ComponentTypes.BUTTON,
							style: Constants.ButtonStyles.PRIMARY,
							label: "Back",
							custom_id: `reactionrole_${interaction.member?.id}_home`
						}, {
							type: Constants.ComponentTypes.BUTTON,
							style: Constants.ButtonStyles.DANGER,
							label: "Cancel",
							custom_id: `reactionrole_${interaction.member?.id}_cancel`
						}
					]
				}
            ],
            deleteLog: [
                {
                    type: Constants.ComponentTypes.ACTION_ROW,
                    components: [
                        {
                            type: Constants.ComponentTypes.SELECT_MENU,
                            placeholder: "Select a logging type",
                            custom_id: `log_${interaction.member?.id}_addlogtype`,
                            max_values: 2,
                            min_values: 1,
                            options: customData.types.map((t) => ({ label: t, value: t }))
                        }
                    ]
                },
                {
					type: Constants.ComponentTypes.ACTION_ROW,
					components: [
						{
							type: Constants.ComponentTypes.BUTTON,
							style: Constants.ButtonStyles.PRIMARY,
							label: "Back",
							custom_id: `reactionrole_${interaction.member?.id}_home`
						}, {
							type: Constants.ComponentTypes.BUTTON,
							style: Constants.ButtonStyles.DANGER,
							label: "Cancel",
							custom_id: `reactionrole_${interaction.member?.id}_cancel`
						}
					]
				}
            ]
        }
    }

    readonly execute = async (interaction: CommandInteraction): Promise<Message | void> => {

        const guild = this.bot.findGuild(interaction.guildID!!) as Guild,
            data = await this.bot.getModuleData("Logging", guild) as moduleData,
            channel = interaction.channel as (TextChannel | NewsChannel),
            subcommand = interaction.data.options?.[0]!! as InteractionDataOptionsSubCommand

        switch (subcommand.name) {

        case "create": {
            const channelData: (LogChannelStructure | undefined) = data.channels.find((c) => c.channelID === channel.id);

            upsertCustomData(this.bot, interaction, {
                id: channel.id,
                types: channelData?.types ?? []
            })

            return interaction.createMessage({
                embeds: [this.create(this.bot, interaction)],
                components: (await this.components(this.bot, interaction)).home
            })
        }

        case "delete": {
            const channelData = data.channels.find((c) => c.channelID === channel.id);

            if (!channelData)
                return interaction.createMessage("This channel is not a log channel");

            data.channels.splice(data.channels.indexOf(channelData), 1);

            try {
                await this.bot.updateModuleData("Logging", data, guild);

                return interaction.createMessage(`${this.bot.constants.emojis.tick} Removed log channel`);
            } catch (e) {
                await interaction.createMessage(`${this.bot.constants.emojis.cross} Failed to remove log channel`);
                throw new Error(e as string);
            }

        }
        
        }

    }

    readonly update = async (component: ComponentInteraction): Promise<Message | void> => {
        
        const guild = this.bot.findGuild(component.guildID!!) as Guild,
            customData = await getCustomData(this.bot, component.message.interaction?.id!!)?.data!! as CustomDataStructure,
            moduleData = await this.bot.getModuleData("Logging", guild) as moduleData;

        switch (component.data.custom_id.split("_")[2]) {

        case "addlog": {

            return component.editParent(
                {
                    components: (await this.components(this.bot, component)).addLog
                }
            )
        }

        case "removelog": {

            return component.editParent(
                {
                    components: (await this.components(this.bot, component)).deleteLog
                }
            )
        }

        case "addlogtype": {
            await component.deferUpdate();

            customData.types = [...customData.types, ...(component.data as InteractionComponentSelectMenuData).values as LogChannelTypes[]]

            const embed = this.create(this.bot, component);

            return await component.editParent(
                {
                    content: undefined,
                    embeds: [embed],
                    components: (await this.components(this.bot, component)).home
                }
            )
        }

        case "save": {
            await component.deferUpdate();

            const obj: LogChannelStructure = {
                channelID: component.channel.id,
                types: customData.types
            }

            //if data found, delete existing data
            if (moduleData.channels.find((c) => c.channelID === component.channel.id))
                moduleData.channels.splice(moduleData.channels.findIndex((c) => c.channelID === component.channel.id), 1);

            moduleData.channels.push(obj);

            try {
                await this.bot.updateModuleData("Logging", moduleData, guild);

                return component.editParent({ content: `${this.bot.constants.emojis.tick} Saved log channel`, embeds: [], components: [] });
            } catch (e) {
                await component.editParent({ content: `${this.bot.constants.emojis.cross} Failed to save log channel`, embeds: [], components: [] });
                throw new Error(e as string);
            }
        }

        case "home": {
            return await component.editParent(
				{
					content: undefined,
					embeds: [this.create(this.bot, component)],
					components: (await this.components(this.bot, component)).home
				}
			);
        }

        case "cancel": {
            return component.editParent(
				{
					content: `${this.bot.constants.emojis.x} Cancelled.`,
					embeds: [],
					components: []
				}
			);
        }

        }

    }

}