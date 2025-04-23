import { Guild, User } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import { Case, moduleData } from "../main";
import { updateLogEntry } from "./logHandler";

export async function getCases(bot: ExtendedClient, guild: Guild, userID: string, caseID?: string): Promise<Case[]> {
	const data = await bot.getModuleData("Moderation", guild.id) as moduleData;

	if (!data) return [];

	if (caseID) {
		return data.cases.filter((c) => c.id === caseID);
	}
	else {
		return data.cases.filter((c) => c.userID === userID);
	}
}

export async function addCase(bot: ExtendedClient, guild: Guild, caseData: Case): Promise<void> {
	const data = await bot.getModuleData("Moderation", guild.id) as moduleData;

	if (!data) return;

	data.cases ? data.cases.push(caseData) : data.cases = [caseData];

	try {
		await bot.updateModuleData("Moderation", data, guild);
	} catch (e) {
		throw new Error("Could not update data");
	}
}

export async function removeCase(bot: ExtendedClient, guild: Guild, caseID: string): Promise<void> {
	const data = await bot.getModuleData("Moderation", guild.id) as moduleData;

	if (!data) return;

	data.cases = data.cases.filter((c) => c.id !== caseID);

	try {
		await bot.updateModuleData("Moderation", data, guild);
	} catch (e) {
		throw new Error("Could not update data");
	}
}

export async function resolveCase(bot: ExtendedClient, guild: Guild, caseID: string, moderatorID: string, reason: string): Promise<void> {
	const data = await bot.getModuleData("Moderation", guild.id) as moduleData;

	if (!data) return;

	const caseToResolve = data.cases.find((c) => c.id === caseID);

	if (!caseToResolve) return;

	caseToResolve.resolved = {
		moderatorID,
		reason
	};

	try {
		//Try to get DM channel of user and dm them
		// const dmChannel = await bot.getDMChannel(caseToResolve.userID);
		const dmChannel = await (bot.findUser(caseToResolve.userID) as User).createDM();

		if (dmChannel) {
			await dmChannel.createMessage({
				embeds: [{
					title: "Your case has been resolved by a moderator.",
					description: `A case of yours: \`${caseToResolve.action} (${caseToResolve.id})\` has been resolved.`,
					fields: [
						{
							name: "Reason",
							value: reason
						}
					],
					color: bot.constants.config.colors.default,
					timestamp: new Date().toISOString(),
					footer: {
						text: `Case ID: ${caseToResolve.id}`
					}
				}]
			});
		}

    // remove punishments
    switch (caseToResolve.action) {
      case "timeout":
        caseToResolve.time = undefined;
        caseToResolve.resolved = {
          moderatorID,
          reason
        };
        guild.members.get(caseToResolve.userID)?.edit({
          communicationDisabledUntil: undefined
        });
        break;
      case "ban":
        caseToResolve.resolved = {
          moderatorID,
          reason
        };
        guild.removeBan(caseToResolve.userID, reason).catch(() => {});
        break;
    }


		await bot.updateModuleData("Moderation", data, guild);
		await updateLogEntry(bot, guild, caseToResolve);
	} catch (e) {
    // eslint-disable-next-line no-console
	}
}