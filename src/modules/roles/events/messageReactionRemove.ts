import { Constants, EventReaction, Guild, Member, PossiblyUncachedMessage, PrivateChannel, Role, Uncached, User } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import Main from "../../main/main";
import Roles, { RolesMessage } from "../main";

export const run = async (bot: ExtendedClient, msg: PossiblyUncachedMessage, reactor: User | Member | Uncached, emoji: EventReaction): Promise<void> => {
  console.log("Reaction removed", msg, reactor, emoji);
  
  if (!msg || !emoji || !reactor) return;
  
  const channel = bot.getChannel(msg.channelID);
  if (!channel || channel.type !== Constants.ChannelTypes.GUILD_TEXT) return;

  const guild: Guild = bot.findGuild(channel.guildID) as Guild,
    rolesModule = bot.getModule("Roles") as Roles,
    mainModule = bot.getModule("Main") as Main,
    msgData: RolesMessage = await rolesModule.getReactionMessage(msg.id, guild.id) as RolesMessage,
    member = guild.members.get(reactor.id);

  if (!member || !msgData || member.bot) return;

  if (!await mainModule.handlePermission(member, "roles.reaction.interact")) return;

  const emote = emoji.emoji.id,
    rData = msgData.roles.find((r) => r.emote.id === emote);
  
  if (rData) {

    const role: Role = bot.findRole(guild, rData.role) as Role,
      dmChannel: PrivateChannel | undefined = await member.user.createDM();

    if (!member.roles.includes(role.id)) return;

    try {
      await member.removeRole(role.id);
      
      if (dmChannel) dmChannel.createMessage({content: `${bot.constants.emojis.tick} You have removed the role \`${role.name}\` in \`${guild.name}\`.`});
    } catch (e) {
      if (dmChannel) dmChannel.createMessage({content: `${bot.constants.emojis.warning.red} There was a problem while removing your role.`});
    }

  }

};