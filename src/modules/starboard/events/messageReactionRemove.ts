import { Channel, Member, Message, PossiblyUncachedMessage, TextChannel, Uncached, User, EventReaction } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import { handleStarredMessage } from "../internals/starHandler";

export const run = async (bot: ExtendedClient, msgObj: PossiblyUncachedMessage, reactor: User | Member | Uncached, reaction: EventReaction): Promise<void> => {
  if (!msgObj || !reaction || !reactor) return;

  if (reaction.emoji.name !== "⭐") return;

  let msg: Message;

  if (!(msgObj instanceof Message)) msg = await (bot.getChannel((msgObj.channel as Channel).id) as TextChannel).getMessage(msgObj.id) as Message;
  else msg = msgObj as Message;

  if (!msg) return;

  const guild = bot.findGuild(msgObj.guildID);

  if (!guild) return;

  const member = bot.findMember(guild, reactor.id);

  if (member?.bot) return;

  await handleStarredMessage(bot, guild, msg as Message, "remove", reactor.id);
};