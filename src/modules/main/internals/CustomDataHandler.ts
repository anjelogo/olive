/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyInteraction } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";

export interface CustomData {
    id: string;
    data: any;
}

export function getCustomData(bot: ExtendedClient, interactionID: string): CustomData | undefined {
	const data = bot.interactionCustomData.find((cd) => cd.id === interactionID);
	if (!data) console.error("Could not get custom data: No custom data found for this interaction or interaction expired");
	return data;
}

export function upsertCustomData(bot: ExtendedClient, interaction: AnyInteraction, payload: any) {
	let data = bot.interactionCustomData.find((cd) => cd.id === interaction.id);
	if (!data) bot.interactionCustomData.push({
		id: interaction.id,
		data: payload
	});
	else
		data = payload;
}

export function deleteCustomData(bot: ExtendedClient, interaction: AnyInteraction) {
	const data = bot.interactionCustomData.find((cd) => cd.id === interaction.id);
	if (!data) console.error("Could not delete custom data: No custom data found for this interaction or interaction expired");
	else bot.interactionCustomData.slice(bot.interactionCustomData.indexOf(data), 1);
}