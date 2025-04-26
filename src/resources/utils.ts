import { PartialEmoji } from "oceanic.js";

export const log = (Module: string, message: string): void => {
  console.log(`[${Module}] ${message}`);
};

export const convertFromUserTime = (time: string): number => {
  // ex: 10d -> 864000000
  // support: 10m, 10d, 10h, 10m, 10s

  const timeRegex = /(\d+)([dhms])/g;
  const timeUnits = {
    d: 86400000,
    h: 3600000,
    m: 60000,
    s: 1000
  };
  let totalTime = 0;
  let match;

  while ((match = timeRegex.exec(time)) !== null) {
    const unit = match[2];
    const value = parseInt(match[1], 10);
    totalTime += value * timeUnits[unit as keyof typeof timeUnits];
  }
  return totalTime;
};

export const HMS = (time: number): string => {
  if (time || !isNaN(time)) {
    time = time / 1000;

    const days = (Math.floor(time / (60 * 60 * 24))),
      hours = (Math.floor(time / ((60 * 60)) % 24)),
      minutes = (Math.floor(time / (60)) % 60),
      seconds = (Math.floor(time) % 60),
      parsedTime = [];

    if (days >= 1) parsedTime.push(days);
    if (hours >= 1) parsedTime.push(hours);
    minutes >= 10 ? parsedTime.push(minutes) : parsedTime.push(`0${minutes}`);
    seconds >= 10 ? parsedTime.push(seconds) : parsedTime.push(`0${seconds}`);

    return parsedTime.join(":");
  } else
    return ("00:00:00:00");
};

export const resolveEmoji = (emote: string): PartialEmoji | undefined => {
  const custom = /<a?:.+?:\d+>/g;

  if (emote.match(custom)) {
    const id = emote.match(/\d+/g) as unknown as string,
      name = emote.match(/[A-Z]+/gi) as unknown as string;
    return { id: id[0], name: name[0] };
  }

};

export const parseEmoji = (emote: PartialEmoji): string => {
  if (!emote.id || !emote.id)
    return "❓";

  return `<${emote.animated ? "a" : ""}:${emote.name}:${emote.id}>`;
};

export const convertSnowflake = (snowflake: string): Date => {
  const milliseconds = BigInt(snowflake) >> 22n;
  return new Date(Number(milliseconds) + 1420070400000);
};