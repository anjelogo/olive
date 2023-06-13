import { AnyInteraction } from "oceanic.js";
import Bot from "../../../main";

export interface CustomData {
    id: string;
    data: any;
}

export function getCustomData(bot: Bot, interactionID: string): CustomData | undefined {
	const data = bot.interactionCustomData.find((cd) => cd.id === interactionID);
	if (!data) throw new Error("No custom data found for this interaction");
	return data;
}

export function upsertCustomData(bot: Bot, interaction: AnyInteraction, payload: any) {
	let data = bot.interactionCustomData.find((cd) => cd.id === interaction.id);
	if (!data) bot.interactionCustomData.push({
		id: interaction.id,
		data: payload
	});
	else
		data = payload;
}

export function deleteCustomData(bot: Bot, interaction: AnyInteraction) {
	const data = bot.interactionCustomData.find((cd) => cd.id === interaction.id);
	if (!data) throw new Error("No custom data found for this interaction");
	bot.interactionCustomData.slice(bot.interactionCustomData.indexOf(data), 1);
}