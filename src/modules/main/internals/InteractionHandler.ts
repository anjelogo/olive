import { CommandInteraction, ComponentInteraction, Constants, Embed, Member, Message, MessageFlags, ModalSubmitInteraction } from "oceanic.js";
import { Options } from "../../../Base/Command";
import ExtendedClient from "../../../Base/Client";
import Main from "../main";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";

export const commandHandler = async (bot: ExtendedClient, interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void | boolean> => {
  const member: Member = interaction.member as Member,
    command = bot.commands.filter((c) => c.commands.includes(interaction.data.name))[0],
    mainModule = bot.getModule("Main") as Main;  

  if (!command) return interaction.createFollowup({content: `${bot.constants.emojis.x} I couldn't find that command!`});
  if (interaction.channel && interaction.channel.type !== Constants.ChannelTypes.GUILD_TEXT && interaction.data.type === Constants.ApplicationCommandTypes.MESSAGE)
    return interaction.createFollowup({content: `${bot.constants.emojis.x} You can only run these commands in servers!`});

  if (!command.noDefer)
    await interaction.defer(MessageFlags.EPHEMERAL);

  const requirePerms: string[] = [],
    permissions: string[] = [];

  if (command.devOnly && (interaction.member && !bot.constants.config.developers.includes(interaction.member.id)))
    return interaction.createFollowup({content: `${bot.constants.emojis.x} You can't run this command!`});

  if (command.permissions) {
    for (const p of command.permissions) {
      if (!await mainModule.hasPerm(interaction.member, p)) permissions.push(p);
    }
  }

  //Replace subcommands permissions here
  /*     if (command.subcommands && args.length) {
      const subcommand = command.subcommands.find((cmd: Subcommands) => cmd.name.toLowerCase() === args[0].toLowerCase());

      if (subcommand && subcommand.permissions) {
        for (const p of subcommand.permissions) {
          const Module: Main = bot.getModule("Main");
          if (!await Module.hasPerm(msg.member, p)) permissions.push(p);
        }
      }
    } */

  if (command.options && interaction.data.options) {
    const options = interaction.data.options,
      commandOption = command.options.find((cmd) => cmd.name.toLowerCase() === options.raw[0].name.toLowerCase()) as Options;

    if (commandOption) {
      if (commandOption.permissions) {
        for (const p of commandOption.permissions) {
          if (!await mainModule.hasPerm(interaction.member, p)) permissions.push(p);
        }
      }

      if (commandOption.type === Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP
        && commandOption.options
        && options.raw.length > 0) {
        const subcommand = commandOption.options.find((cmd) => cmd.name.toLowerCase() === options.raw[0].name.toLowerCase()) as Options;

        if (subcommand && subcommand.permissions) {
          for (const p of subcommand.permissions) {
            if (!await mainModule.hasPerm(interaction.member, p)) permissions.push(p);
          }
        }
      }
    }
  }

  if (requirePerms.length)
    return interaction.createFollowup({content: `${bot.constants.emojis.x} I need more permissions to run that command.\n\n Permissions neede: \`${requirePerms.join("`, `")}\``});

  if (permissions.length)
    return await mainModule.handlePermission(member, [... new Set(permissions)], interaction);

  //Missing arguments thing (Review later, i dont think it's necessary)
  /*   if (command.args && args.length < command.args.filter((arg: Arguments) => !arg.optional).length)
    return msg.channel.createMessage(bot.getModule("Main").createHelpEmbed(command, `${bot.constants.emojis.warning.yellow} You're missing some arguments!`));

  if (command.subcommands && args.length) {
    for (let i = 0; i < command.subcommands.length; i++) {
      const subcommand = command.subcommands[i];
      if (args[0].toLowerCase() === subcommand.name.toLowerCase()) {
        if (subcommand.args && args.length - 1 < subcommand.args.filter((arg: Arguments) => !arg.optional).length) {
          return msg.channel.createMessage(bot.getModule("Main").createHelpEmbed(command, `${bot.constants.emojis.warning.yellow} You're missing some arguments!`));
        }
      }
    }
  } */

  try {
    console.log(`[${command.category}] ${interaction.user.username} ran command ${command.commands[0]}`);
    await command.execute(interaction);
  } catch (e) {
    const embed: Embed = {
      author: {
        name: "Command Error"
      },
      color: bot.constants.config.colors.red,
      fields: [{
        name: "Error",
        value: `\`\`\`x1\n${e}\n\`\`\``
      },
      {
        name: "What do I do?",
        value: "Report the error to an admin if you cannot solve this"
      }
      ],
      type: "rich"
    };
    interaction.createFollowup({ embeds: [embed], flags: Constants.MessageFlags.EPHEMERAL });
    console.error(e);
  }

};

export const updateHandler = async (bot: ExtendedClient, component: ComponentInteraction, authorID: string): Promise<Message | void> => {
  const command = bot.commands.filter((c) => c.commands.includes(component.data.customID.split("_")[0]))[0];
  if (!command) return;

  const member = component.member as Member;
  
  if (!["0", member.id].includes(authorID)) return;

  try {
    await component.deferUpdate();
    await command.update(component);
  } catch (e) {
    const embed: Embed = {
      author: {
        name: "Command Error"
      },
      color: bot.constants.config.colors.red,
      fields: [{
        name: "Error",
        value: `\`\`\`x1\n${e}\n\`\`\``
      },
      {
        name: "What do I do?",
        value: "Report the error to an admin if you cannot solve this"
      }
      ],
      type: "rich"
    };
    component.createFollowup({ embeds: [embed], flags: Constants.MessageFlags.EPHEMERAL });
    throw new Error(e as string);
  }

};

export const modalHandler = async (bot: ExtendedClient, modal: ModalSubmitInteraction, authorID: string): Promise<Message | void> => {

  const command = bot.commands.filter((c) => c.commands.includes(modal.data.customID.split("_")[0]))[0];
  if (!command) return;

  const member = modal.member  as Member;

  if (member.id !== authorID) return;

  try {
    await command.modalSubmit(modal);
  } catch (e) {
    const embed: Embed = {
      author: {
        name: "Command Error"
      },
      color: bot.constants.config.colors.red,
      fields: [{
        name: "Error",
        value: `\`\`\`x1\n${e}\n\`\`\``
      },
      {
        name: "What do I do?",
        value: "Report the error to an admin if you cannot solve this"
      }
      ],
      type: "rich"
    };
    modal.createFollowup({ embeds: [embed], flags: Constants.MessageFlags.EPHEMERAL });
    throw new Error(e as string);
  }

};