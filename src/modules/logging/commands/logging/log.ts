import { ComponentInteraction, Constants, CommandInteraction, Message, Guild, MessageActionRow, MessageComponentSelectMenuInteractionData, ContainerComponent } from "oceanic.js";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import { upsertCustomData, getCustomData } from "../../../main/internals/CustomDataHandler";
import { LogChannelTypes, LoggingModuleData } from "../../../../Database/interfaces/LoggingModuleData";

export interface CustomDataStructure {
  id: string,
  types: LogChannelTypes[]
}

export default class Log extends Command {

  constructor(bot: ExtendedClient) {

    super(bot);

    this.commands = ["log"];
    this.description = "Create log channels";
    this.example = "log create";
    this.options = [
      {
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        name: "modify",
        description: "Create/edit a log channel",
        permissions: ["logging.channel.modify"]
      }, {
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        name: "delete",
        description: "Delete a log channel",
        permissions: ["logging.channel.delete"]
      }
    ];

  }

  private validTypes = ["vc", "welcome", "moderation", "starboard"] as const;

  private typesAvailable = async (bot: ExtendedClient, interaction: (CommandInteraction | ComponentInteraction)) => {
    const customData = getCustomData(bot, interaction instanceof CommandInteraction ? interaction.id : interaction.message.interactionMetadata?.id as string)?.data as CustomDataStructure;

    return this.validTypes.filter(t => !customData.types.includes(t));
  }

  private createContainer = (bot: ExtendedClient, interaction: (CommandInteraction | ComponentInteraction), actionRow: MessageActionRow[]) => {
    const interactionID = interaction instanceof CommandInteraction ? interaction.id : interaction.message.interactionMetadata?.id;
    if (!interactionID) throw new Error("Interaction ID is undefined");
    const customData = getCustomData(bot, interactionID)?.data as CustomDataStructure,
      container: ContainerComponent = {
        type: Constants.ComponentTypes.CONTAINER,
        components: [
          {
            type: Constants.ComponentTypes.TEXT_DISPLAY,
            content: "# Log Channel Information"
          }, {
            type: Constants.ComponentTypes.TEXT_DISPLAY,
            content: "## Currently Logging"
          }, {
            type: Constants.ComponentTypes.TEXT_DISPLAY,
            content: customData.types.length ? customData.types.map(t => `\`${t}\``).join(", ") : "None"
          },
          ...actionRow
        ]
      };

    return container;
  }

  private actionRow = async (bot: ExtendedClient, interaction: (CommandInteraction | ComponentInteraction)):
  Promise<
    {
      home: MessageActionRow[],
      addLog: MessageActionRow[],
      deleteLog: MessageActionRow[]
    }
  > => {
    const customData = getCustomData(bot, interaction instanceof CommandInteraction ? interaction.id : interaction.message.interactionMetadata?.id as string)?.data as CustomDataStructure;

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
              customID: `log_${interaction.member?.id}_addlog`
            }, {
              type: Constants.ComponentTypes.BUTTON,
              style: Constants.ButtonStyles.SECONDARY,
              label: "Remove Log",
              disabled: this.validTypes.filter(t => !customData.types.includes(t)).length === this.validTypes.length,
              customID: `log_${interaction.member?.id}_removelog`
            }, {
              type: Constants.ComponentTypes.BUTTON,
              style: Constants.ButtonStyles.SUCCESS,
              label: "Save",
              customID: `log_${interaction.member?.id}_save`
            }, {
              type: Constants.ComponentTypes.BUTTON,
              style: Constants.ButtonStyles.DANGER,
              label: "Cancel",
              customID: `log_${interaction.member?.id}_cancel`
            }
          ]
        }
      ],
      addLog: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.STRING_SELECT,
              placeholder: "Select a logging type",
              customID: `log_${interaction.member?.id}_addlogtype`,
              maxValues: (await this.typesAvailable(this.bot, interaction)).length,
              minValues: 1,
              options: (await this.typesAvailable(this.bot, interaction)).map((t) => ({ label: t, value: t}))
            }
          ]
        }, {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.BUTTON,
              style: Constants.ButtonStyles.PRIMARY,
              label: "Back",
              customID: `log_${interaction.member?.id}_home`
            }, {
              type: Constants.ComponentTypes.BUTTON,
              style: Constants.ButtonStyles.DANGER,
              label: "Cancel",
              customID: `log_${interaction.member?.id}_cancel`
            }
          ]
        }
      ],
      deleteLog: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.STRING_SELECT,
              placeholder: "Select a logging type",
              customID: `log_${interaction.member?.id}_removelogtype`,
              maxValues: 2,
              minValues: 1,
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
              customID: `log_${interaction.member?.id}_home`
            }, {
              type: Constants.ComponentTypes.BUTTON,
              style: Constants.ButtonStyles.DANGER,
              label: "Cancel",
              customID: `log_${interaction.member?.id}_cancel`
            }
          ]
        }
      ]
    };
  }

  readonly execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {

    const guild = this.bot.findGuild(interaction.guildID) as Guild,
      data = await this.bot.getModuleData("Logging", guild.id) as LoggingModuleData,
      channel = interaction.channel,
      subcommand = interaction.data.options.getSubCommand(true)[0];

    if (!channel) {
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.x} This command can only be used in a text channel`
      });
    }

    switch (subcommand) {

    case "modify": {
      const channelData = data.channels.find((c) => c.channelID === channel.id);

      upsertCustomData(this.bot, interaction, {
        id: channel.id,
        types: channelData?.types ?? []
      });

      return interaction.createFollowup({
        components: [(this.createContainer(this.bot, interaction, (await this.actionRow(this.bot, interaction)).home))],
        flags: Constants.MessageFlags.IS_COMPONENTS_V2
      });
    }

    case "delete": {
      const channelData = data.channels.find((c) => c.channelID === channel.id);

      if (!channelData)
        return interaction.createFollowup({ content: `${this.bot.constants.emojis.x} This channel is not a log channel` });

      data.channels.splice(data.channels.indexOf(channelData), 1);

      try {
        await this.bot.updateModuleData("Logging", data, guild);

        return interaction.createFollowup({ content: `${this.bot.constants.emojis.tick} Removed log channel`});
      } catch (e) {
        await interaction.createMessage({ content: `${this.bot.constants.emojis.x} An error occured while removing the log channel` });
        throw new Error(e as string);
      }

    }
    
    }

  }

  readonly update = async (component: ComponentInteraction): Promise<Message | void> => {
    
    const guild = this.bot.findGuild(component.guildID) as Guild,
      customData = await getCustomData(this.bot, component.message.interactionMetadata?.id as string)?.data as CustomDataStructure,
      moduleData = await this.bot.getModuleData("Logging", guild.id) as LoggingModuleData;

    switch (component.data.customID.split("_")[2]) {

    case "addlog": {

      return component.editOriginal(
        {
          components: [(this.createContainer(this.bot, component, (await this.actionRow(this.bot, component)).addLog))]
        }
      );
    }

    case "removelog": {

      return component.editOriginal(
        {
          components: [(this.createContainer(this.bot, component, (await this.actionRow(this.bot, component)).deleteLog))]
        }
      );
    }
    case "save": {

      const obj = {
        channelID: component.channelID,
        types: customData.types
      };

      //if data found, delete existing data
      if (moduleData.channels.find((c) => c.channelID === component.channelID))
        moduleData.channels.splice(moduleData.channels.findIndex((c) => c.channelID === component.channelID), 1);

      moduleData.channels.push(obj);

      try {
        await this.bot.updateModuleData("Logging", moduleData, guild);

        return component.editOriginal({
          components: [
            {
              type: Constants.ComponentTypes.TEXT_DISPLAY,
              content: `${this.bot.constants.emojis.tick} Saved log channel`,
            }
          ]
        });
      } catch (e) {
        await component.editOriginal({
          components: [
            {
              type: Constants.ComponentTypes.TEXT_DISPLAY,
              content: `${this.bot.constants.emojis.x} An error occured while saving the log channel`,
            }
          ]
        });
        throw new Error(e as string);
      }
    }

    case "addlogtype": {

      customData.types = [...customData.types, ...(component.data as MessageComponentSelectMenuInteractionData).values.getStrings() as LogChannelTypes[]];
      return await component.editOriginal(
        {
          components: [(this.createContainer(this.bot, component, (await this.actionRow(this.bot, component)).home))]
        }
      );
    }
    case "removelogtype": {
      customData.types = customData.types.filter((t) => !(component.data as MessageComponentSelectMenuInteractionData).values.getStrings().includes(t as string));
      return await component.editOriginal(
        {
          components: [(this.createContainer(this.bot, component, (await this.actionRow(this.bot, component)).home))]
        }
      );
    }
    case "home": {
      return await component.editOriginal(
        {
          components: [(this.createContainer(this.bot, component, (await this.actionRow(this.bot, component)).home))]
        }
      );
    }

    case "cancel": {
      return component.editOriginal(
        {
          components: [{
            type: Constants.ComponentTypes.TEXT_DISPLAY,
            content: `${this.bot.constants.emojis.x} Cancelled log channel modifications`
          }]
        }
      );
    }

    }

  }

}