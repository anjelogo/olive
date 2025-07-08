import { CommandInteraction, Constants, Guild, Member, Role } from "oceanic.js";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import { RolesModuleData } from "../../../../Database/interfaces/RolesModuleData";

export default class Autorole extends Command {

  public type = Constants.ApplicationCommandTypes.CHAT_INPUT;

  constructor(bot: ExtendedClient) {

    super(bot);

    this.commands = ["autorole"];
    this.description = "Manage auto roles for members joining the server.";
    this.example = "autorole list";
    this.permissions = ["roles.autorole.edit", "roles.autorole.view"];
    this.options = [
      {
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
        name: "list",
        description: "Edit the auto roles list",
        options: [
          {
            type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            name: "add",
            description: "Add role to autoroles",
            options: [
              {
                type: Constants.ApplicationCommandOptionTypes.ROLE,
                name: "role",
                description: "The role you want to add",
                required: true
              }
            ]
          }, {
            type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            name: "remove",
            description: "Remove role to autoroles",
            options: [
              {
                type: Constants.ApplicationCommandOptionTypes.ROLE,
                name: "role",
                description: "The role you want to remove",
                required: true
              }
            ]
          }, {
            type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            name: "view",
            description: "List roles in autoroles"
          }
        ]
      }, 
    ];
  }

  readonly execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {
    const guild: Guild = this.bot.findGuild(interaction.guildID) as Guild,
      member: Member = interaction.member as Member,
      data = await this.bot.getModuleData("Roles", guild.id) as RolesModuleData,
      botMember: Member = this.bot.findMember(guild, this.bot.user.id) as Member,
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
        : guild.id,
      memberHighestRole: Role = this.bot.findRole(guild, memberHighestRoleID[0]) as Role;

    const subcommandgroup = interaction.data.options.getSubCommand(true)[0];

    switch(subcommandgroup) {

    case "list": {
      const subcommand = interaction.data.options.getSubCommand(true)[1];

      if (!subcommand)
        return interaction.createFollowup({content: `${this.bot.constants.emojis.x} Subcommand not found`, flags: Constants.MessageFlags.EPHEMERAL});
      switch(subcommand) {
      case "add": {
        const role = interaction.data.options.getRole("role", true);

        if (data.autoRoles.includes(role.id))
          return interaction.createFollowup({content: `${this.bot.constants.emojis.x} That role is already an Auto Role.`});
    
        if (!role)
          return interaction.createFollowup({content: `${this.bot.constants.emojis.x} I could not find that role.`});
    
        if (role.position > memberHighestRole.position && !member.permissions.has("ADMINISTRATOR"))
          return interaction.createFollowup({content: `${this.bot.constants.emojis.x} That role's position is higher than your highest role, ${memberHighestRole.mention}. Perhaps try moving your role higher to solve this problem.`});
    
        if (role.position > botHighestRole.position)
          return interaction.createFollowup({content: `${this.bot.constants.emojis.x} That role's position is higher than my highest role, ${botHighestRole.mention}. Perhaps try moving my role higher to solve this problem.`});
    
        if (role.tags.premiumSubscriber || role.tags.guildConnections)
          return interaction.createFollowup({content: `${this.bot.constants.emojis.x} That role is a premium subscriber or has guild connections, which are not allowed as auto roles.`});

        try {
          data.autoRoles.push(role.id);
          await this.bot.updateModuleData("Roles", data, guild);
          return interaction.createFollowup({content: `${this.bot.constants.emojis.tick} Added role ${role.mention} to the roles list!`});
        } catch (e) {
          return interaction.createFollowup({content: `${this.bot.constants.emojis.x} Error trying to add role to roles list!`});
        }
      }
    
      case "remove": {
        const role = interaction.data.options.getRole("role", true);
        
        if (!role)
          return interaction.createFollowup({content: `${this.bot.constants.emojis.x} I could not find that role.`});
    
        if (role.position > memberHighestRole.position)
          return interaction.createFollowup({content: `${this.bot.constants.emojis.x} That role's position is higher than your highest role, ${memberHighestRole.mention}. Perhaps try moving your role higher to solve this problem.`});
    
        if (role.position > botHighestRole.position)
          return interaction.createFollowup({content: `${this.bot.constants.emojis.x} That role's position is higher than my highest role, ${botHighestRole.mention}. Perhaps try moving my role higher to solve this problem.`});
  
        if (!data.autoRoles.includes(role.id))
          return interaction.createFollowup({content: `${this.bot.constants.emojis.x} That role is not in the auto roles list.`});

        try {
          const i = data.autoRoles.indexOf(role.id);
          if (i > -1) data.autoRoles.splice(i, 1);
    
          await this.bot.updateModuleData("Roles", data, guild);
          return interaction.createFollowup({content: `${this.bot.constants.emojis.tick} Removed role ${role.mention} from the roles list!`});
        } catch (e) {
          return interaction.createFollowup({content: `${this.bot.constants.emojis.x} Error trying to remove role from roles list!`});
        }
      }

      case "view": {
        return interaction.createFollowup(
          {
            content: data.autoRoles.length
              ? `${this.bot.constants.emojis.tick} Users will receive the following role(s) upon joining: \n\n${data.autoRoles.map((r) => (`<@&${r}>`)).join("\n")}`
              : `${this.bot.constants.emojis.x} Users receive no roles upon joining.`,
          }
        );
        break;
      }
        break;
      }
    }
    

    }

  };

}