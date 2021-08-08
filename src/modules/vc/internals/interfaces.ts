import Eris from "eris";

export interface Category {
	catID: string;
	channelID: string;
	channels: Channel[];
}

export interface Channel {
	channelID: string;
	owner: string;
	createdAt: number;
	locked: boolean;
	parentOverwrites: {
		id: string;
		type: Eris.PermissionType;
		allow: number;
		deny: number;
	}[]
}