import { Constants } from "oceanic.js";
import { BaseModuleData } from "./BaseModuleData";

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
		type: Constants.OverwriteTypes;
		allow: bigint | string | undefined;
		deny: bigint	| string | undefined;
	}[]
}

export interface VCModuleData extends BaseModuleData {
  guildID: string;
  categories: Category[];
  defaultName: {
    channel: string[];

    /** @deprecated Category default name will always be "Join to create private channel" */
    category?: string;
  };
}