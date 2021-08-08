import { Emoji } from "eris";

export const log = (Module: string, message: string): void => {
	console.log(`[${Module}] ${message}`);
};

export const HMS = (time: number): string => {
	if (time || !isNaN(time)) {
		time = time / 1000;

		const hours = (Math.floor(time / ((60 * 60)) % 24)),
			minutes = (Math.floor(time / (60)) % 60),
			seconds = (Math.floor(time) % 60),
			parsedTime = [];

		if (hours >= 1) parsedTime.push(hours);
		minutes >= 10 ? parsedTime.push(minutes) : parsedTime.push(`0${minutes}`);
		seconds >= 10 ? parsedTime.push(seconds) : parsedTime.push(`0${seconds}`);

		return parsedTime.join(":");
	} else
		return ("00:00:00");
};

export const resolveEmoji = (emote: string): Partial<Emoji> | undefined => {
	const custom = /<a?:.+?:\d+>/g;

	if (emote.match(custom)) {
		const id = emote.match(/\d+/g) as unknown as string,
			name = emote.match(/[A-Z]+/gi) as unknown as string;
		return { id: id[0], name: name[0] };
	}

};

export const parseEmoji = (emote: Partial<Emoji>): string => {
	if (!emote.id || !emote.id)
		return "❓";

	return `<${emote.animated ? "a" : ""}:${emote.name}:${emote.id}>`;
};