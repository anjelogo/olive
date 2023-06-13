import Bot from "../../../main";

export const run = async (bot: Bot, error: Error): Promise<void> => {
	console.error(error);
};