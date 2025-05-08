import { MessageActionRow, CommandInteraction, ComponentInteraction, Constants, Guild, Member, Message, Role, TextChannel, MessageComponentSelectMenuInteractionData, SelectOption, PartialEmoji, ContainerComponent } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import { upsertCustomData, getCustomData } from "../../../main/internals/CustomDataHandler";
import { moduleData, RolesMessage } from "../../main";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";

interface CustomDataStructure {
  id: string,
  channelID: string,
  reactionRoles: {
    role: string;
    emote: PartialEmoji
  }[],
  partial: Partial<
  {
    role: string;
    emote: PartialEmoji;
  }>
}

export default class Reactionrole extends Command {

  constructor(bot: ExtendedClient) {

    super(bot);

    this.commands = ["reactionrole"];
    this.description = "Create/edit reactionroles";
    this.example = "reactionrole modify 867761105245831188";
    this.options = [
      {
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        name: "modify",
        description: "Create/Edit reaction role messages",
        permissions: ["roles.reaction.modify"],
        options: [
          {
            type: Constants.ApplicationCommandOptionTypes.STRING,
            name: "messageid",
            description: "The ID of the message",
            required: true
          }
        ]
      }
    ];

  }

  private roles = async (bot: ExtendedClient, interaction: (CommandInteraction | ComponentInteraction)): Promise<Role[]> => {
    const interactionID = interaction instanceof CommandInteraction ? interaction.id : interaction.message.interactionMetadata?.id;
    if (!interactionID) throw new Error("Interaction ID is undefined");
    const customData = getCustomData(bot, interactionID)?.data as CustomDataStructure,
      guild = bot.findGuild(interaction.guildID) as Guild,
      member = interaction.member as Member,
      botMember = this.bot.findMember(guild, this.bot.user.id) as Member,
      botHighestRoleID = botMember.roles
        .map((r) => 
          ({
            name: (this.bot.findRole(guild, r) as Role).name,
            position: (this.bot.findRole(guild, r) as Role).position
          }))
        .sort((a, b) => b.position - a.position).map((r) => r.name),
      botHighestRole: Role = this.bot.findRole(guild, botHighestRoleID[0]) as Role,
      memberHighestRoleID = member.roles.length
        ? member.roles
          .map((r) => 
            ({
              name: (this.bot.findRole(guild, r) as Role).name,
              position: (this.bot.findRole(guild, r) as Role).position
            }))
          .sort((a, b) => b.position - a.position).map((r) => r.name)
        : [guild.id],
      memberHighestRole: Role = this.bot.findRole(guild, memberHighestRoleID[0]) as Role;

    const roles: Role[] = [];

    for (const r of guild.roles.map((r) => r.id )) {
      const role: Role = this.bot.findRole(guild, r) as Role;
  
      if (!role) continue;
  
      if (customData) {
        if (customData.reactionRoles.find((rr) => rr.role === r)) continue;
      }
      if (role.position >= botHighestRole.position) continue;
      if (member.roles.length && role.position > memberHighestRole.position && !member.permissions.has("ADMINISTRATOR")) continue;
      if (role.id === guild.id) continue;
      if (role.managed) continue;
  
      roles.push(role);
    }
  
    return [...new Set(roles)];
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
            content: "# Reaction Role Information"
          }, {
            type: Constants.ComponentTypes.TEXT_DISPLAY,
            content: "## Current Roles"
          }, {
            type: Constants.ComponentTypes.TEXT_DISPLAY,
            content: customData.reactionRoles.length
              ? customData.reactionRoles.map((r) => `${this.bot.constants.utils.parseEmoji(r.emote)} - ${(this.bot.findRole(interaction.guild as Guild, r.role) as Role).mention}`).join("\n")
              : "No roles added yet."
          },
          ...actionRow
        ]
      };

    return container;
  }

  private actionRow = async (bot: ExtendedClient, interaction: (CommandInteraction | ComponentInteraction)):
  Promise<
    {
      home: MessageActionRow[];
      addSelectRole: MessageActionRow[];
      addSelectReaction: MessageActionRow[];
      removeSelectRole: MessageActionRow[];
    }
  > => {
    const customData = getCustomData(bot, interaction instanceof CommandInteraction ? interaction.id : interaction.message.interactionMetadata?.id as string)?.data as CustomDataStructure,
      guild = bot.findGuild(interaction.guildID) as Guild,
      emotes: PartialEmoji[] = Object.values(this.bot.constants.emojis.numbers)
        .map((e) => this.bot.constants.utils.resolveEmoji(e))
        .filter((e): e is PartialEmoji => e !== undefined && !customData.reactionRoles.find((r) => r.emote.id === e.id));

    return {
      home: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.BUTTON,
              style: Constants.ButtonStyles.PRIMARY,
              label: "Add Role",
              disabled: customData.reactionRoles.length > 10 || !(await this.roles(bot, interaction)).length,
              customID: `reactionrole_${interaction.member?.id}_addselectrole`
            }, {
              type: Constants.ComponentTypes.BUTTON,
              style: Constants.ButtonStyles.SECONDARY,
              label: "Remove Role",
              disabled: customData.reactionRoles.length < 1,
              customID: `reactionrole_${interaction.member?.id}_removeselectrole`
            }, {
              type: Constants.ComponentTypes.BUTTON,
              style: Constants.ButtonStyles.SUCCESS,
              label: "Done",
              disabled: customData.reactionRoles.length < 1,
              customID: `reactionrole_${interaction.member?.id}_save`
            }, {
              type: Constants.ComponentTypes.BUTTON,
              style: Constants.ButtonStyles.DANGER,
              label: "Cancel",
              customID: `reactionrole_${interaction.member?.id}_cancel`
            }
          ]
        }
      ],
      addSelectRole: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.ROLE_SELECT,
              placeholder: "Choose role",
              customID: `reactionrole_${interaction.member?.id}_addselectreaction`,
              maxValues: 1,
              minValues: 1,
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
              customID: `reactionrole_${interaction.member?.id}_home`
            }, {
              type: Constants.ComponentTypes.BUTTON,
              style: Constants.ButtonStyles.DANGER,
              label: "Cancel",
              customID: `reactionrole_${interaction.member?.id}_cancel`
            }
          ]
        }
      ],
      addSelectReaction: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.STRING_SELECT,
              placeholder: "Choose Emote",
              customID: `reactionrole_${interaction.member?.id}_add`,
              maxValues: 1,
              minValues: 1,
              options: emotes.map((e) => ({ label: e.name, value: e.id, emoji: e })) as SelectOption[]
            }
          ]
        }, {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.BUTTON,
              style: Constants.ButtonStyles.PRIMARY,
              label: "Back",
              customID: `reactionrole_${interaction.member?.id}_home`
            }, {
              type: Constants.ComponentTypes.BUTTON,
              style: Constants.ButtonStyles.DANGER,
              label: "Cancel",
              customID: `reactionrole_${interaction.member?.id}_cancel`
            }
          ]
        }
      ],
      removeSelectRole: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.STRING_SELECT,
              placeholder: "Choose role",
              customID: `reactionrole_${interaction.member?.id}_remove`,
              maxValues: 1,
              minValues: 1,
              options: customData.reactionRoles.map((r) => ({ label: (bot.findRole(guild, r.role) as Role).name, value: r.role, }))
            }
          ]
        }, {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.BUTTON,
              style: Constants.ButtonStyles.PRIMARY,
              label: "Back",
              customID: `reactionrole_${interaction.member?.id}_home`
            }, {
              type: Constants.ComponentTypes.BUTTON,
              style: Constants.ButtonStyles.DANGER,
              label: "Cancel",
              customID: `reactionrole_${interaction.member?.id}_cancel`
            }
          ]
        }
      ]
    };
  }

  readonly execute = async (interaction: (CommandInteraction)): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {
    const guild = this.bot.findGuild(interaction.guildID) as Guild,
      channel = interaction.channel as TextChannel,
      data = await this.bot.getModuleData("Roles", guild.id) as moduleData,
      messageid = interaction.data.options.getString("messageid", true);

    let message: Message | undefined;

    try {
      message = this.bot.findMessage(this.bot.getChannel(channel.id) as TextChannel, messageid);
    } catch (e) {
      return interaction.createFollowup(
        {
          components: [
            {
              type: Constants.ComponentTypes.TEXT_DISPLAY,
              content: "I could not find that message."
            }
          ],
        }
      );
    }

    if (!message)
      return interaction.createFollowup({
        components: [
          {
            type: Constants.ComponentTypes.TEXT_DISPLAY,
            content: "I could not find that message."
          }
        ],
      });

    const msgData: RolesMessage | undefined = data.messages.find((m) => m.id === (message as Message).id);

    upsertCustomData(this.bot, interaction, {
      id: message.id,
      channelID: message.channelID,
      reactionRoles: msgData?.roles ?? [],
      partial: {
        role: "",
        emote: ""
      }
    });

    return interaction.createFollowup({
      components: [(this.createContainer(this.bot, interaction, (await this.actionRow(this.bot, interaction)).home))],
      flags: Constants.MessageFlags.IS_COMPONENTS_V2
    });
  }

  readonly update = async (component: ComponentInteraction): Promise<Message | void> => {

    const guild = this.bot.findGuild(component.guildID) as Guild,
      customData = await getCustomData(this.bot, component.message.interactionMetadata?.id as string)?.data as CustomDataStructure,
      moduleData = await this.bot.getModuleData("Roles", guild.id) as moduleData;

    switch (component.data.customID.split("_")[2]) {

    case "addselectrole": {

      return component.editOriginal(
        {
          components: [(this.createContainer(this.bot, component, (await this.actionRow(this.bot, component)).addSelectRole))],
        }
      );
    }

    case "removeselectrole": {

      return await component.editOriginal(
        {
          components: [(this.createContainer(this.bot, component, (await this.actionRow(this.bot, component)).removeSelectRole))],
        }
      );
    }

    case "addselectreaction": {
      customData.partial.role = (component.data as MessageComponentSelectMenuInteractionData).resolved.roles.first()?.id;

      return component.editOriginal(
        {
          components: [(this.createContainer(this.bot, component, (await this.actionRow(this.bot, component)).addSelectReaction))],
        }
      );
    }

    case "add": {
      const emojiGuild = this.bot.findGuild(this.bot.constants.config.emojiGuild) as Guild,
        emoji = emojiGuild.emojis.find((e) => e.id === (component.data as MessageComponentSelectMenuInteractionData).values.getStrings()[0]);

      customData.partial.emote = emoji as PartialEmoji;

      customData.reactionRoles.push(customData.partial as { role: string; emote: PartialEmoji; });

      customData.partial = {};

      return await component.editOriginal(
        {
          components: [(this.createContainer(this.bot, component, (await this.actionRow(this.bot, component)).home))],
        }
      );
    }

    case "remove": {
      let message: Message | undefined;

      try {
        message = this.bot.findMessage(this.bot.getChannel(customData.channelID) as TextChannel, customData.id);
      } catch (e) {
        return component.editOriginal({ content: "I could not find that message." });
      }

      if (!message)
        return component.editOriginal({ content: "I could not find that message." });

      customData.reactionRoles.splice(customData.reactionRoles.findIndex((r) => r.role === customData.partial.role), 1);

      customData.partial = {};

      return await component.editOriginal(
        {
          components: [(this.createContainer(this.bot, component, (await this.actionRow(this.bot, component)).home))],
        }
      );
    }

    case "home": {
      let message: Message | undefined;

      try {
        message = this.bot.findMessage(this.bot.getChannel(customData.channelID) as TextChannel, customData.id);
      } catch (e) {
        return component.editOriginal({ content: "I could not find that message." });
      }

      if (!message)
        return component.editOriginal({ content: "I could not find that message." });

      customData.partial = {};

      return await component.editOriginal(
        {
          components: [(this.createContainer(this.bot, component, (await this.actionRow(this.bot, component)).home))],
        }
      );
    }

    case "save": {
      const obj: RolesMessage = {
        id: customData.id,
        channelID: customData.channelID,
        roles: customData.reactionRoles
      };

      //if data found, delete existing data
      if (moduleData.messages.find((m) => m.id === customData.id))
        moduleData.messages.splice(moduleData.messages.findIndex((m) => m.id === customData.id), 1);

      moduleData.messages.push(obj);

      try {
        await component.editOriginal({
          components: [
            {
              type: Constants.ComponentTypes.TEXT_DISPLAY,
              content: `${this.bot.constants.emojis.tick} Message is being updated`
            }
          ]
        });
        await this.bot.updateModuleData("Roles", moduleData, guild);

        const message = this.bot.findMessage(this.bot.getChannel(customData.channelID) as TextChannel, customData.id),
          reactions = obj.roles.map((r) => r.emote);

        await message?.deleteReactions();

        for (const reaction of reactions) {
          if (!reaction.id || !reaction.name) continue;

          const emote: string = this.bot.constants.utils.parseEmoji(reaction).replace("<", "").replace(">", "");

          await message?.createReaction(emote);
        }
        return component.editOriginal({
          components: [
            {
              type: Constants.ComponentTypes.TEXT_DISPLAY,
              content: `${this.bot.constants.emojis.tick} Saved reaction roles`,
            }
          ]
        });
      } catch (e) {
        await component.editOriginal({
          components: [
            {
              type: Constants.ComponentTypes.TEXT_DISPLAY,
              content: `${this.bot.constants.emojis.x} An error occured while editing`,
            }
          ]
        });
        throw new Error(e as string);
      }
    }

    case "cancel": {
      return component.editOriginal(
        {
          components: [{
            type: Constants.ComponentTypes.TEXT_DISPLAY,
            content: `${this.bot.constants.emojis.x} Cancelled reaction roles`
          }]
        }
      );
    }

    }

  }
}