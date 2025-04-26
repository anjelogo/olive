import { Guild, Member, Message, PartialEmoji, PossiblyUncachedMessage, Uncached, User } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import { handleStarredMessage } from "../internals/starHandler";

export const run = async (bot: ExtendedClient, msg: PossiblyUncachedMessage, reactor: Uncached | Member | User, emoji: PartialEmoji) => {
  if (emoji.name !== "⭐") return;

  if (!msg || !emoji || !reactor || !msg.guildID) return;

  const guild = bot.findGuild(msg.guildID) as Guild,
    member = guild.members.get(reactor.id);

  if (!member || member.bot) return;

  await handleStarredMessage(bot, guild, msg as Message, "remove", reactor.id);
};