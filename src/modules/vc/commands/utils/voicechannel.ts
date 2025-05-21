import { CommandInteraction, Constants, Guild, Member, Role, VoiceChannel, ModalSubmitInteraction, InteractionCallbackResponse, AnyInteractionChannel, Uncached, ComponentInteraction, MessageComponent } from "oceanic.js";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import Main from "../../../main/main";
import { createLogEntry } from "../../internals/handler";
import { VCModuleData, Category, Channel } from "../../../../Database/interfaces/VCModuleData";

export default class Voicechannel extends Command {
  
  constructor(bot: ExtendedClient) {

    super(bot);

    this.commands = ["voicechannel"];
    this.description = "The main Voicechannel command";
    this.example = "voicechannel";
    this.permissions = ["vc.view"];
    this.options = [
      {
        name: "set",
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
        description: "Set values",
        permissions: ["vc.edit"],
        options: [
          {
            name: "name",
            type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            description: "Set a new name for the voice channel",
            options: [
              {
                name: "name",
                type: Constants.ApplicationCommandOptionTypes.STRING,
                description: "The new name of the voicechannel",
                required: false
              }
            ]
          }, {
            name: "category",
            type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            description: "Set a category as a Private VC category",
            options: [
              {
                name: "channel",
                type: Constants.ApplicationCommandOptionTypes.CHANNEL,
                description: "The channel",
                required: true
              }
            ]
          }, {
            name: "owner",
            type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            description: "Set the new owner of the channel",
            options: [
              {
                name: "member",
                type: Constants.ApplicationCommandOptionTypes.USER,
                description: "The new owner of the channel",
                required: true
              }  
            ]
          }
        ]
      }, {
        name: "lock",
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        description: "Lock the private voice channel",
        permissions: ["vc.lock"],
      }, {
        name: "unlock",
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        description: "Unlock the private voice channel",
        permissions: ["vc.unlock"],
      }, {
        name: "information",
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        description: "Get information about the channel",
        options: [
          {
            name: "channel",
            type: Constants.ApplicationCommandOptionTypes.CHANNEL,
            description: "The channel you want information on",
            required: false
          }
        ]
      }
    ];
  }

  public execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | InteractionCallbackResponse<AnyInteractionChannel | Uncached> | void> => {
    const member = interaction.member as Member,
      guild = this.bot.findGuild(interaction.guildID) as Guild,
      data = await this.bot.getModuleData("VC", guild.id) as VCModuleData,
      subcommand = interaction.data.options.raw[0].name,
      mainModule = this.bot.getModule("Main") as Main;

    switch(subcommand) {

    case "set": {
      const suboption = interaction.data.options.getSubCommand(true)[1];

      if (!suboption) return interaction.createFollowup({content: "Could not find suboption!", flags: Constants.MessageFlags.EPHEMERAL});

      switch (suboption) {

      case "name": {
        if (!member.voiceState?.channelID)
          return interaction.createFollowup({content: "You need to be in a Private Voice channel to run this command!"});

        const channel: VoiceChannel = this.bot.findChannel(guild, member.voiceState.channelID) as VoiceChannel,
          cat: Category | undefined = data.categories.find((c: Category) => c.catID === channel.parentID);

        if (!channel || !cat)  
          return interaction.createFollowup({content: "Could not find channel.", flags: Constants.MessageFlags.EPHEMERAL});
    
        const channelObj: Channel | undefined = cat.channels.find((c) => c.channelID === channel.id);
        if (!channelObj)
          return interaction.createFollowup({content: "That Voice Channel is not a Private Voice Channel!"});
        if (channelObj.owner !== member.id) return interaction.createFollowup({content: "You're not the owner of this voice channel!", flags: Constants.MessageFlags.EPHEMERAL});
        if (!await mainModule.handlePermission(member, "vc.edit.name", interaction)) return;
      
        const newName = interaction.data.options.getString("name", false);

        if (!newName) return interaction.createModal({
          title: "Set New Channel Name",
          customID: `voicechannel_${interaction.member?.id}_setchannelname`,
          components: [
            {
              type: Constants.ComponentTypes.ACTION_ROW,
              components: [
                {
                  customID: `voicechannel_${interaction.member?.id}_channelname`,
                  type: Constants.ComponentTypes.TEXT_INPUT,
                  style: Constants.TextInputStyles.SHORT,
                  label:  "New Channel Name",
                  maxLength: 32,
                  minLength: 1,
                  required: true
                }
              ]
            }
          ]
        });

        try {
          await channel.edit({ name: newName});
          return interaction.createFollowup({content: `${this.constants.emojis.tick} Successfully changed the name of the channel to \`${newName}\``, flags: Constants.MessageFlags.EPHEMERAL});
        } catch (e) {
          return interaction.createFollowup({content: `${this.constants.emojis.warning.red} Error trying to edit the channel name! Perhaps insufficient permissions?`, flags: Constants.MessageFlags.EPHEMERAL});
        }
      }

      case "owner": {
        const newOwner = interaction.data.options.getMember("member", true);

        if (!member.voiceState?.channelID)
          return interaction.createFollowup({content: "You need to be in a Private Voice channel to run this command!", flags: Constants.MessageFlags.EPHEMERAL});

        const channel: VoiceChannel = this.bot.findChannel(guild, member.voiceState.channelID) as VoiceChannel,
          cat: Category | undefined = data.categories.find((c: Category) => c.catID === channel.parentID);

        if (!channel || !cat)  
          return interaction.createFollowup({content: "Could not find channel.", flags: Constants.MessageFlags.EPHEMERAL});
    
        const channelObj: Channel | undefined = cat.channels.find((c) => c.channelID === channel.id);
        if (!channelObj)
          return interaction.createFollowup({content: "That Voice Channel is not a Private Voice Channel!", flags: Constants.MessageFlags.EPHEMERAL});
        if (channelObj.owner !== member.id && !member.permissions.has("ADMINISTRATOR")) return interaction.createFollowup({content: "You're not the owner of this voice channel!", flags: Constants.MessageFlags.EPHEMERAL});
        if (!await mainModule.handlePermission(member, "vc.edit.owner", interaction)) return;

        if (!newOwner || !channel.voiceMembers.map((m) => m.id).includes(newOwner.id))
          return interaction.createFollowup({content: "The user is not in the voice channel!", flags: Constants.MessageFlags.EPHEMERAL});
            
        channelObj.owner = newOwner.id;
            
        try {
          await this.bot.updateModuleData("VC", data, guild);

          await createLogEntry(this.bot, "newOwner", channel, member, { newOwner });

          // message the new owner
          const newOwnerDM = await newOwner.user.createDM();
          await newOwnerDM.createMessage({content: `${this.constants.emojis.warning.yellow} You are now the owner of \`${channel.name}\` in \`${channel.guild.name}\`!`});

          return interaction.createFollowup({content: `${this.constants.emojis.tick} Successfully transferred ownership of Private Channel to \`${newOwner.username}\``, flags: Constants.MessageFlags.EPHEMERAL});
        } catch (e) {
          return interaction.createFollowup({content: `${this.constants.emojis.warning.red} Error trying to edit the channel owner!`});
        }
      }

      case "category": {
        const channel = interaction.data.options.getChannel("channel", true);

        if (channel.type !== Constants.ChannelTypes.GUILD_CATEGORY)
          return interaction.createFollowup({content: "That channel is not a category!"});

        const categories: Category[] = data.categories;

        if (categories.map((c) => c.catID).includes(channel.id))
          return interaction.createFollowup({content: "That category already exists as a Private Voice Channel Category!"});
        if (!await mainModule.handlePermission(member, "vc.edit.category", interaction)) return;

        const voice = await guild.createChannel(Constants.ChannelTypes.GUILD_VOICE, {
            name: data.defaultName.category,
            parentID: channel.id,
          }),
          newCat: Category = {
            catID: channel.id,
            channelID: voice.id,
            channels: []
          };

        categories.push(newCat);

        try {
          await this.bot.updateModuleData("VC", data, guild);
          await interaction.createFollowup({content: `${this.constants.emojis.tick} Successfully made \`${channel.name}\` a Private VC category. You can manually rename \`${voice.name}\` to change the name.`, flags: Constants.MessageFlags.EPHEMERAL});
          return interaction.createFollowup({ content: `${this.bot.constants.emojis.warning.yellow} To remove the channel, simply delete the channel.`, flags: Constants.MessageFlags.EPHEMERAL});
        } catch (e) {
          return interaction.createFollowup({content: `${this.constants.emojis.warning.red} Error trying to add category!`, flags: Constants.MessageFlags.EPHEMERAL});
        }
      }

      }

      break;
    }

    case "lock": {
      if (!member.voiceState?.channelID)
        return interaction.createFollowup({content: "You need to be in a Private Voice channel to run this command!", flags: Constants.MessageFlags.EPHEMERAL});

      const channel: VoiceChannel = this.bot.findChannel(guild, member.voiceState.channelID) as VoiceChannel,
        cat: Category | undefined = data.categories.find((c: Category) => c.catID === channel.parentID);

      if (!channel || !cat)  
        return interaction.createFollowup({content: "Could not find channel.", flags: Constants.MessageFlags.EPHEMERAL});

      const channelObj: Channel | undefined = cat.channels.find((c) => c.channelID === channel.id);
      if (!channelObj)
        return interaction.createFollowup({content: "That Voice Channel is not a Private Voice Channel!"});
      if (channelObj.owner !== member.id) return interaction.createFollowup({content: "You're not the owner of this voice channel!", flags: Constants.MessageFlags.EPHEMERAL});
      if (!await mainModule.handlePermission(member, "VC.lock", interaction)) return;
      
      if (channelObj.locked)
        return interaction.createFollowup({content: "This channel is already locked!", flags: Constants.MessageFlags.EPHEMERAL});

      channelObj.locked = true;

      try {
        const existingOverwrites = channel.permissionOverwrites.map((p) => ({ id: p.id, type: p.type, allow: Number(p.allow.toString()), deny: Number(p.deny.toString()) }));

        for (const overwrite of existingOverwrites)
          await channel.editPermission(overwrite.id, { allow: BigInt(35652096), deny: BigInt(1048576), type: overwrite.type});

        await channel.editPermission((this.bot.findRole(guild, "@everyone") as Role).id, { allow: BigInt(35652096), deny: BigInt(1048576), type: Constants.OverwriteTypes.ROLE});

        await this.bot.updateModuleData("VC", data, guild);
        return interaction.createFollowup({ content: `${this.bot.constants.emojis.tick} Locked channel!`, flags: Constants.MessageFlags.EPHEMERAL });
      } catch (e) {
        return interaction.createFollowup({content: `${this.constants.emojis.warning.red} Error trying to lock channel!`, flags: Constants.MessageFlags.EPHEMERAL});
      }
    }

    case "unlock": {
      if (!member.voiceState?.channelID)
        return interaction.createFollowup({content: "You need to be in a Private Voice channel to run this command!", flags: Constants.MessageFlags.EPHEMERAL});

      const channel: VoiceChannel = this.bot.findChannel(guild, member.voiceState.channelID) as VoiceChannel,
        cat: Category | undefined = data.categories.find((c: Category) => c.catID === channel.parentID);

      if (!channel || !cat)  
        return interaction.createFollowup({content: "Could not find channel.", flags: Constants.MessageFlags.EPHEMERAL});

      const channelObj: Channel | undefined = cat.channels.find((c) => c.channelID === channel.id);
      if (!channelObj)
        return interaction.createFollowup({content: "That Voice Channel is not a Private Voice Channel!", flags: Constants.MessageFlags.EPHEMERAL});
      if (channelObj.owner !== member.id) return interaction.createFollowup({content: "You're not the owner of this voice channel!", flags: Constants.MessageFlags.EPHEMERAL});
      if (!await mainModule.handlePermission(member, "vc.lock", interaction)) return;

      channelObj.locked = false;

      try {
        for (const overwrite of channelObj.parentOverwrites)
          await channel.editPermission(overwrite.id, { allow: overwrite.allow, deny: overwrite.deny, type: overwrite.type });

        await channel.editPermission((this.bot.findRole(guild, "@everyone") as Role).id, { allow: undefined, deny: undefined, type: Constants.OverwriteTypes.ROLE});

        await this.bot.updateModuleData("VC", data, guild);
        return interaction.createFollowup({ content: `${this.bot.constants.emojis.tick} Unlocked channel!`, flags: Constants.MessageFlags.EPHEMERAL });
      } catch (e) {
        return interaction.createFollowup({content: `${this.constants.emojis.warning.red} Error trying to unlock channel!`, flags: Constants.MessageFlags.EPHEMERAL});
      }
    }

    case "information": {
      let channel = interaction.data.options.getChannel("channel", false) as VoiceChannel | undefined;

      if (!channel && member.voiceState?.channelID)
        channel = this.bot.getChannel(member.voiceState.channelID);
      else if (!channel)
        return interaction.createFollowup({content: "Specify or join a private voice channel to the information of a channel!", flags: Constants.MessageFlags.EPHEMERAL});

      const cat: Category | undefined = data.categories.find((c: Category) => c.catID === channel?.parentID);

      if (!cat)
        return interaction.createFollowup({content: "That's not a Private Voice Channel!", flags: Constants.MessageFlags.EPHEMERAL});

      const channelObj: Channel | undefined = cat.channels.find((c) => c.channelID === channel?.id);
        
      if (!channelObj)
        return interaction.createFollowup({content: "That's not a Private Voice Channel!", flags: Constants.MessageFlags.EPHEMERAL});
      
      const owner: Member | undefined = this.bot.findMember(guild, channelObj.owner);

      if (!owner)
        return interaction.createFollowup({content: "Could not find the owner of this channel!", flags: Constants.MessageFlags.EPHEMERAL});

      const components = await createLogEntry(this.bot, "information", channel as VoiceChannel, member, { skipLog: true, owner, locked: channelObj.locked, createdAt: channelObj.createdAt });


      return interaction.createFollowup({ components: components as MessageComponent[], flags: Constants.MessageFlags.IS_COMPONENTS_V2 });
        
    }

    }

  }

  readonly update = async (component: ComponentInteraction): Promise<FollowupMessageInteractionResponse<ComponentInteraction> | void> => {
    
    switch (component.data.customID.split("_")[2]) {

    case "information": {
      // validate the channel
      const channelID = component.data.customID.split("_")[3],
        channel: VoiceChannel = this.bot.findChannel(this.bot.findGuild(component.guildID as string) as Guild, channelID) as VoiceChannel;

      if (!channel) return component.createFollowup({ content: `${this.bot.constants.emojis.x} Channel not found`, flags: Constants.MessageFlags.EPHEMERAL });

      const channelObj: Channel | undefined = (await this.bot.getModuleData("VC", channel.guild.id) as VCModuleData).categories.find((c) => c.catID === channel.parentID)?.channels.find((c) => c.channelID === channel.id);

      if (!channelObj) return component.createFollowup({ content: `${this.bot.constants.emojis.x} Channel Data not found`, flags: Constants.MessageFlags.EPHEMERAL });

      const owner = this.bot.findMember(channel.guild, channelObj.owner),
        components = await createLogEntry(this.bot, "information", channel, component.member as Member, { skipLog: true, owner, locked: channelObj.locked, createdAt: channelObj.createdAt});

      if (!components) return component.createFollowup({ content: `${this.bot.constants.emojis.x} Error creating information`, flags: Constants.MessageFlags.EPHEMERAL });

      await component.createFollowup({ components, flags: Constants.MessageFlags.IS_COMPONENTS_V2 | Constants.MessageFlags.EPHEMERAL });

      break;
    }
    default: {
      component.createFollowup({content: `${this.bot.constants.emojis.x} Unknown Command`, flags: Constants.MessageFlags.EPHEMERAL});
    }

    }
  }

  readonly modalSubmit = async (modal: ModalSubmitInteraction<AnyInteractionChannel | Uncached>): Promise<void> => {
    modal.defer(Constants.MessageFlags.EPHEMERAL);

    switch (modal.data.customID.split("_")[2]) {

    case "setchannelname": {
      const newName = modal.data.components.getTextInputComponent("voicechannel_" + modal.member?.id + "_channelname")?.value;

      const channelID = modal.member?.voiceState?.channelID ?? "";
      const channel: VoiceChannel = this.bot.findChannel(this.bot.findGuild(modal.guildID as string) as Guild, channelID) as VoiceChannel;

      try {
        await channel.edit({ name: newName});
        modal.createFollowup({content: `${this.constants.emojis.tick} Successfully changed the name of the channel to \`${newName}\``, flags: Constants.MessageFlags.EPHEMERAL});
        return;
      } catch (e) {
        modal.createFollowup({content: `${this.constants.emojis.warning.red} Error trying to edit the channel name! Perhaps insufficient permissions?`, flags: Constants.MessageFlags.EPHEMERAL});
        return;
      }
      break;
    }
    }
  }
}