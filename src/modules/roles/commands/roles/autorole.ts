import { CommandInteraction, Constants, Guild, Member, Role } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import { moduleData } from "../../main";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";

export default class Autorole extends Command {

  constructor(bot: ExtendedClient) {

    super(bot);

    this.commands = ["autorole"];
    this.description = "Edit or view autoroles",
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
      data: moduleData = await this.bot.getModuleData("Roles", guild.id) as moduleData,
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
      memberHighestRole: Role = this.bot.findRole(guild, memberHighestRoleID[0]) as Role,
      subcommandgroup = interaction.data.options.raw[0].name;

    switch(subcommandgroup) {

    case "list": {
      const subcommand = interaction.data.options.getSubCommand(true)[1];

      if (!subcommand)
        return interaction.createFollowup({content: "Subcommand not found", flags: Constants.MessageFlags.EPHEMERAL});

      const role = interaction.data.options.getRole("role", true);

      switch(subcommand) {
      case "add": {
        if (data.autoRoles.includes(role.id))
          return interaction.createFollowup({content: "That role is already an Auto Role."});
    
        if (!role)
          return interaction.createFollowup({content: "I could not find that role"});
    
        if (role.position > memberHighestRole.position && !member.permissions.has("ADMINISTRATOR"))
          return interaction.createFollowup({content: `That role's position is higher than your highest role, ${memberHighestRole.mention}. Perhaps try moving your role higher to solve this problem.`});
    
        if (role.position > botHighestRole.position)
          return interaction.createFollowup({content: `That role's position is higher than my highest role, ${botHighestRole.mention}. Perhaps try moving my role higher to solve this problem.`});
    
        try {
          data.autoRoles.push(role.id);
          await this.bot.updateModuleData("Roles", data, guild);
          return interaction.createFollowup({content: `${this.bot.constants.emojis.tick} Added role ${role.mention} to the roles list!`});
        } catch (e) {
          return interaction.createFollowup({content: "Error trying to add role to roles list!"});
        }
      }
    
      case "remove": {
        if (!role)
          return interaction.createFollowup({content: "I could not find that role"});
    
        if (role.position > memberHighestRole.position)
          return interaction.createFollowup({content: `That role's position is higher than your highest role, ${memberHighestRole.mention}. Perhaps try moving your role higher to solve this problem.`});
    
        if (role.position > botHighestRole.position)
          return interaction.createFollowup({content: `That role's position is higher than my highest role, ${botHighestRole.mention}. Perhaps try moving my role higher to solve this problem.`});
  
        try {
          const i = data.autoRoles.indexOf(role.id);
          if (i > -1) data.autoRoles.splice(i, 1);
    
          await this.bot.updateModuleData("Roles", data, guild);
          return interaction.createFollowup({content: `${this.bot.constants.emojis.tick} Removed role ${role.mention} from the roles list!`});
        } catch (e) {
          return interaction.createFollowup({content: "Error trying to add role to roles list!"});
        }
      }

      case "view": {
        return interaction.createFollowup(
          {
            content: data.autoRoles.length
              ? `${this.bot.constants.emojis.tick} Users will recieve the following role(s) upon joining: \n\n${data.autoRoles.map((r) => (`<@&${r}>`)).join("\n")}`
              : `${this.bot.constants.emojis.x} Users recieve no roles upon joining.`,
          }
        );
        break;
      }
        break;
      }
    }
    

    }

  }

}