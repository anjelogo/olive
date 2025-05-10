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
  categories: Category[];
  defaultName: {
    category: string;
    channel: string;
  };
}