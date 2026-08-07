import { BaseModuleData } from "./BaseModuleData";

export interface Ticket {
	channelID: string;
	memberID: string;
	createdAt: number;
}

export interface ModmailModuleData extends BaseModuleData<"guild"> {
	guildID: string;
	entryChannelID: string;
	categoryID: string;
	logChannelID: string;
	ticketLimit: number;
	openTickets: Ticket[];
	blockedUserIDs: string[];
}
