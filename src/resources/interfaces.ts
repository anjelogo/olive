/* eslint-disable @typescript-eslint/no-explicit-any */

import { Member, Role } from "oceanic.js";

export interface Permnodes {
	name: string,
	description: string,
	default?: boolean
}

export interface Constants {
	emojis: typeof import("./emojis");
	config: typeof import("./config");
	utils: typeof import("./utils");
}

export interface Entity {
	type: "member" | "role" | "undefined";
	member?: Member;
	role?: Role;
}