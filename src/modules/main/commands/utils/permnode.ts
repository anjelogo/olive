import { CommandInteraction, ComponentInteraction, Constants, ContainerComponent, Guild, Member, Message, MessageActionRow, Role } from "oceanic.js";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import { Entity } from "../../../../resources/interfaces";
import { upsertCustomData, getCustomData } from "../../internals/CustomDataHandler";
import { MainModuleData } from "../../../../Database/interfaces/MainModuleData";

export default class Permnode extends Command {
  
  constructor(bot: ExtendedClient) {

    super(bot);

    this.commands = ["permnode", "permnodes", "permissions", "permission", "perms", "perm"];
    this.description = "Edit Permissions";
    this.example = "permnode set user abdoul permnode.view true";
    this.permissions = ["main.permnode.view"];

    this.options = [
      {
        name: "edit",
        description: "Edit permissions for a user/role",
        permissions: ["main.permnode.edit"],
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        options: [
          {
            name: "entity",
            description: "The user or role you want to edit",
            type: Constants.ApplicationCommandOptionTypes.MENTIONABLE,
            required: true,
          }, {
            name: "permission",
            description: "The permission you want to allow/deny",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: true,
          }, {
            name: "boolean",
            description: "Allow or deny the permission",
            type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
            required: true
          }
        ]
      }, {
        name: "remove",
        description: "Remove permissions from a user/role",
        permissions: ["main.permnode.remove"],
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        options: [
          {
            name: "entity",
            description: "The user or role you want to edit",
            type: Constants.ApplicationCommandOptionTypes.MENTIONABLE,
            required: true,
          }, {
            name: "permission",
            description: "The permission you want to remove",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: true,
          }
        ]
      }, {
        name: "view",
        description: "View user/role's permissions",
        permissions: ["main.permnode.view"],
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        options: [
          {
            name: "entity",
            description: "The user or role",
            type: Constants.ApplicationCommandOptionTypes.MENTIONABLE,
            required: true,
          }
        ]
      }
    ];
  }

  readonly execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {
    const guild = this.bot.findGuild(interaction.guildID) as Guild,
      data = (await this.bot.getModuleData("Main", guild.id) as unknown) as MainModuleData,
      permissions = data.permissions,
      subcommand = interaction.data.options.getSubCommand(true)[0];

    switch (subcommand) {
    case "edit": {
      // UNTESTED - MIGHT NOT WORK
      // if doesnt work, possible fix: use interaction.data.options.getString("entity", true) instead of interaction.data.resolved.members.map((m) => m.id)[0] || interaction.data.resolved.roles.map((r) => r.id)[0]
      const entity: Entity | undefined = this.bot.findEntity(guild, interaction.data.resolved.roles.map((r) => r.id)[0] || interaction.data.resolved.members.map((m) => m.id)[0]);
      
      if (!entity) return interaction.createFollowup({content: "I could not find that entity!"});
      const permnode = this.bot.perms.find((perm) => perm.name === interaction.data.options.getString("permission", true));
      if (!permnode) return interaction.createFollowup({content: "I could not find that permnode!"});

      const value = interaction.data.options.getBoolean("boolean", true);

      switch (entity.type) {

      case "member": {
        if (!entity.member) return interaction.createFollowup({content: `${this.bot.constants.emojis.warning.red} An error occured.`});
        const member = entity.member as Member;

        const userData = (permissions.find((p) => p.userID === member.id));
        if (!userData) {
          const newPerm = {
            userID: member.id,
            permissions: [{ permission: permnode.name, value }]
          };
          permissions.push(newPerm);
        } else {
          const perms = userData.permissions;

          if (perms.filter((p) => p.permission === permnode.name && p.value === value).length)
            return interaction.createFollowup({content: `User \`${member.username}\` already has \`${permnode.name}\` set as \`${value}\``});

          perms.push({ permission: permnode.name, value });
        }

        data.permissions = permissions;
        await this.bot.updateModuleData("Main", data, guild);
        
        return interaction.createFollowup({content: `${this.bot.constants.emojis.tick} Successfully applied change(s) to user \`${member.username}\`:\n\n+ \`${permnode.name} (${value.toString()})\``});
      }

      case "role": {
        if (!entity.role) return interaction.createFollowup({content: `${this.bot.constants.emojis.warning.red} An error occured.`});
        const role = entity.role as Role;

        const roleData = (permissions.find((p) => p.roleID === role.id));
        if (!roleData) {
          const newPerm = {
            roleID: role.id,
            permissions: [{ permission: permnode.name, value }]
          };
          permissions.push(newPerm);
        } else {
          const perms = roleData.permissions;

          if (perms.filter((p) => p.permission === permnode.name && p.value === value).length)
            return interaction.createFollowup({content: `Role \`${role.name}\` already has \`${permnode.name}\` set as \`${value}\``});

          perms.push({ permission: permnode.name, value });
        }

        data.permissions = permissions;
        await this.bot.updateModuleData("Main", data, guild);
        
        return interaction.createFollowup({content: `${this.bot.constants.emojis.tick} Successfully applied change(s) to role \`${role.name}\`:\n\n+ \`${permnode.name} (${value.toString()})\``});
      }

      }


      break;
    }


    case "remove": {
      const entity: Entity | undefined = this.bot.findEntity(guild, interaction.data.resolved.members.map((m) => m.id)[0] || interaction.data.resolved.roles.map((r) => r.id)[0]);
      
      if (!entity) return interaction.createFollowup({content: "I could not find that entity!"});
      const permnode = this.bot.perms.find((perm) => perm.name === interaction.data.options.getString("permission", true));
      if (!permnode) return interaction.createFollowup({content: "I could not find that permnode!"});

      switch (entity.type) {

      case "member": {
        if (!entity.member) return interaction.createFollowup({content: `${this.bot.constants.emojis.warning.red} An error occured.`});
        const member = entity.member as Member;

        const userData = (permissions.find((p) => p.userID === member.id));
        if (!userData) {
          return interaction.createFollowup({content: `That user does not have the permission \`${permnode.name}\`!`});
        } else {
          const perms = userData.permissions;

          if (!perms.find((p) => p.permission === permnode.name))
            return interaction.createFollowup({content: `That user does not have the permission \`${permnode.name}\`!`});

          perms.splice(perms.findIndex((p) => p.permission === permnode.name), 1);
        }

        data.permissions = permissions;
        await this.bot.updateModuleData("Main", data, guild);
        return interaction.createFollowup({content: `${this.bot.constants.emojis.tick} Successfully applied change(s) to user \`${member.username}\`:\n\n- \`${permnode.name}\``});
      }

      case "role": {
        if (!entity.role) return interaction.createFollowup({content: `${this.bot.constants.emojis.warning.red} An error occured.`});
        const role = entity.role as Role;

        const roleData = (permissions.find((p) => p.roleID === role.id));
        if (!roleData) {
          return interaction.createFollowup({content: `That role does not have the permission \`${permnode.name}\`!`});
        } else {
          const perms = roleData.permissions;

          if (!perms.find((p) => p.permission === permnode.name))
            return interaction.createFollowup({content: `That role does not have the permission \`${permnode.name}\`!`});

          perms.splice(perms.findIndex((p) => p.permission === permnode.name), 1);
        }

        data.permissions = permissions;
        await this.bot.updateModuleData("Main", data, guild);
        return interaction.createFollowup({content: `${this.bot.constants.emojis.tick} Successfully applied change(s) to role \`${role.name}\`:\n\n- \`${permnode.name}\``});
      }

      }


      break;
    }

    case "view": {
      const entity: Entity | undefined = this.bot.findEntity(guild, interaction.data.resolved.members.map((m) => m.id)[0] || interaction.data.resolved.roles.map((r) => r.id)[0]);
      
      if (!entity) return interaction.createFollowup({content: "I could not find that entity!"});

      switch (entity.type) {

      case "member": {
        if (!entity.member) return interaction.createFollowup({content: `${this.bot.constants.emojis.warning.red} An error occurred.`});

        const member = entity.member as Member,
          userData = (permissions.find((p) => p.userID === member.id)),
          strings: string[] = [];

        let perms: {
          name: string;
          description: string;
          value: boolean;
          hoist: number;
        }[] = [];

        perms.push(...this.bot.perms.filter((p) => p.default).map((p) => ({ name: p.name, description: p.description, value: true, hoist: 0 })));

        if (userData) {
          const userPerms = [...userData.permissions];
          for (const perm of userPerms) {
            const permnode = this.bot.perms.find((p) => p.name === perm.permission);
            perms.push({ name: perm.permission, value: perm.value, description: permnode ? permnode.description : "Unknown", hoist: perm.value ? 0 : 1 });
          }
        }

        perms.sort((a, b) => a.hoist - b.hoist);

        for (const perm of perms) {
          perms.map((p) => p.name);
          const dupes = perms.filter((p) => p.name === perm.name);
          if (dupes.length) {
            const i = perms.findIndex((p) => p.name === perm.name && p.value === true);
            if (i > -1) perms.splice(i, 1);
          }
        }

        perms = [...new Set(perms)];

        for (const perm of perms) {
          strings.push(`${perm.value ? this.bot.constants.emojis.tick : this.bot.constants.emojis.x} \`${perm.name}\` - **${perm.description.toString()}**`);
        }

        const roles: {
          name: string;
          id: string;
        }[] = [],
          components: MessageActionRow[] = roles.length
            ? [
              {
                type: Constants.ComponentTypes.ACTION_ROW,
                components: [
                  {
                    type: Constants.ComponentTypes.BUTTON,
                    style: Constants.ButtonStyles.SECONDARY,
                    customID: `permnode_${interaction.member?.id}_viewinheritance`,
                    label: "View inherited permissions"
                  }
                ]
              }
            ]
            : [];

        if (member.roles.length) {
          for (const r of member.roles) {
            const roleData = (permissions.find((p) => p.roleID === r));

            if (!roleData) continue;

            const role: Role = this.bot.findRole(guild, r) as Role;
            roles.push({ name: role.name, id: role.id });
          }
        }

        const container: ContainerComponent = {
          type: Constants.ComponentTypes.CONTAINER,
          components: [
            {
              type: Constants.ComponentTypes.TEXT_DISPLAY,
              content: member.permissions.has("ADMINISTRATOR")
                ? `# ${member.username}'s Permissions\n## ${this.bot.constants.emojis.warning.yellow} This user is a guild administrator! This user will bypass permissions regardless of negated permissions!`
                : `# ${member.username}'s Permissions`,
            },
            {
              type: Constants.ComponentTypes.TEXT_DISPLAY,
              content: strings.join("\n")
            }
          ]
        };

        if (roles.length)
          upsertCustomData(this.bot, interaction, {
            entity: member.id,
            page: 0,
            roles
          });

        return interaction.createFollowup(
          {
            components: [
              container,
              ...components
            ],
            flags: Constants.MessageFlags.IS_COMPONENTS_V2
          },
        );
      }
      case "role": {
        if (!entity.role) return interaction.createFollowup({content: `${this.bot.constants.emojis.warning.red} An error occurred.`});
        const role = entity.role as Role;
        
        const roleData = permissions.find((p) => p.roleID === role.id);
        const allowed = roleData ? roleData.permissions.filter((p) => p.value === true).map((p) => p.permission) : [];
        const denied = roleData ? roleData.permissions.filter((p) => p.value === false).map((p) => p.permission) : [];

        const container: ContainerComponent = {
          type: Constants.ComponentTypes.CONTAINER,
          components: [
            {
              type: Constants.ComponentTypes.TEXT_DISPLAY,
              content: `# ${role.name}'s Permissions`
            },
            {
              type: Constants.ComponentTypes.TEXT_DISPLAY,
              content: `## Allowed\n${allowed.length ? `\`${allowed.join("`, `")}\`` : "Default"}`
            },
            {
              type: Constants.ComponentTypes.TEXT_DISPLAY,
              content: `## Denied\n${denied.length ? `\`${denied.join("`, `")}\`` : "Default (None)"}`
            }
          ]
        };

        return interaction.createFollowup({
          components: [container],
          flags: Constants.MessageFlags.IS_COMPONENTS_V2
        });
      }
      default: {
        console.log(interaction);
        return interaction.createFollowup({
          content: `${this.bot.constants.emojis.warning.red} This command is not available for this entity type.`,
        });
      }
      }
      break;
    }

    }
  }

  readonly update = async (component: ComponentInteraction): Promise<Message | void> => {

    const data = getCustomData(this.bot, component.message.interactionMetadata?.id as string)?.data as { entity: string, page: number; roles: { name: string; id: string }[] },
      guild = this.bot.findGuild(component.guildID) as Guild,
      member = this.bot.findMember(guild, data.entity) as Member,
      moduleData = await this.bot.getModuleData("Main", guild.id) as MainModuleData,
      permissions = moduleData.permissions;

    async function constructEmbed(bot: ExtendedClient, interaction: (ComponentInteraction | CommandInteraction), id: string) {
      const role: Role = bot.findRole(guild, id) as Role,
        roleData = permissions.find((p) => p.roleID === role.id),
        strings: string[] = [];

      let perms: {
        name: string;
        description: string;
        value: boolean;
        hoist: number;
      }[] = [];

      if (role.permissions.has("ADMINISTRATOR"))
        perms.push({ name: "*", description: "Grants access to all module components/commands regardless of negated permissions", value: true, hoist: 0 });

      perms.push(...bot.perms.filter((p) => p.default).map((p) => ({ name: p.name, description: p.description, value: true, hoist: 0 })));

      if (roleData) {
        const rolePerms = [...roleData.permissions];
        for (const perm of rolePerms) {
          const permnode = bot.perms.find((p) => p.name === perm.permission);
          perms.push({ name: perm.permission, value: perm.value, description: permnode ? permnode.description : "Unknown", hoist: perm.value ? 0 : 1 });
        }
      }

      perms.sort((a, b) => a.hoist - b.hoist);

      for (const perm of perms) {
        perms.map((p) => p.name);
        const dupes = perms.filter((p) => p.name === perm.name);
        if (dupes.length) {
          const i = perms.findIndex((p) => p.name === perm.name && p.value === true);
          if (i > -1) perms.splice(i, 1);
        }
      }

      perms = [...new Set(perms)];

      for (const perm of perms) {
        strings.push(`${perm.value ? bot.constants.emojis.tick : bot.constants.emojis.x} \`${perm.name}\` - **${perm.description.toString()}**`);
      }

      const container: ContainerComponent = {
        type: Constants.ComponentTypes.CONTAINER,
        components: [
          {
            type: Constants.ComponentTypes.TEXT_DISPLAY,
            content: `# ${member.username}'s Inherited Permissions (${role.name})`
          },
          {
            type: Constants.ComponentTypes.TEXT_DISPLAY,
            content: strings.join("\n")
          }
        ]
      };

      const components: MessageActionRow[] = [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.BUTTON,
              style: Constants.ButtonStyles.PRIMARY,
              customID: `permnode_${interaction.member?.id}_viewpreviousinheritance`,
              label: "View Previous",
              disabled: 1 >= data.page + 1 ? true : false
            }, {
              type: Constants.ComponentTypes.BUTTON,
              style: Constants.ButtonStyles.PRIMARY,
              customID: `permnode_${interaction.member?.id}_viewnextinheritance`,
              label: "View Next",
              disabled: data.roles.length <= data.page + 1 ? true : false
            }, {
              type: Constants.ComponentTypes.BUTTON,
              style: Constants.ButtonStyles.PRIMARY,
              customID: `permnode_${interaction.member?.id}_viewmemberdefined`,
              label: "View Member Permissions"
            }
          ]
        }
      ];

      return {
        container,
        components
      };
    }

    switch(component.data.customID.split("_")[2]) {

    case "viewinheritance": {
      const obj = await constructEmbed(this.bot, component, data.roles[data.page].id);

      return component.editOriginal({
        components: [
          obj.container,
          ...obj.components
        ]
      });
    }

    case "viewnextinheritance": {
      data.page++;

      const obj = await constructEmbed(this.bot, component, data.roles[data.page].id);

      return component.editOriginal({
        components: [
          obj.container,
          ...obj.components
        ]
      });
    }

    case "viewpreviousinheritance": {
      data.page--;

      const obj = await constructEmbed(this.bot, component, data.roles[data.page].id);

      return component.editOriginal({
        components: [
          obj.container,
          ...obj.components
        ]
      });
    }

    case "viewmemberdefined": {
      data.page = 0;

      const interactionData = {
        name: "view",
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        options: [
          {
            name: "entity",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            value: member.id
          }
        ]
      };

      const mockInteraction = Object.assign({}, component, { data: interactionData });
      this.execute(mockInteraction as unknown as CommandInteraction);
      return;
    }

    }

  }

}