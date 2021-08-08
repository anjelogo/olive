/* eslint-disable @typescript-eslint/no-explicit-any */

import { Member, Role } from "eris";

export interface Permnodes {
	name: string,
	description: string,
	default?: boolean
}

export interface Constants {
	emojis: any;
	config: any;
	utils: any;
}

export interface Entity {
	type: "member" | "role" | "undefined";
	member?: Member;
	role?: Role;
}