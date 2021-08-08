export interface Permissions {
	userID?: string;
	roleID?: string;
	permissions: Permission[]
}

export interface Permission {
	permission: string;
	value: boolean;
}

//Move hasPerm() here

/* export const hasPerm = async (member: Member | null, perm: string) => {
	if (!member || !perm) return false;

	const masterPerm = `${perm.split(/[.\-_]/)[0]}.*`,
		permission: Permnodes | undefined = this.bot.perms.find((p: Permnodes) => p.name === perm),
		moduleData: any = this.data,
		data: Array<Permission> = (<any>moduleData).permissions;

	if (!permission) return false;
	if (member.permissions.has("administrator")) return true;

	let perms: Array<string> = [],
		userData: any = data.length
			? data.find((p: any) => p.userID === member.id)
			: [],
		userPerms: Permnodes[] = userData.length
			? userData.permissions.filter((perm: Permission) => perm.value)
					.forEach((perm: Permission) => this.bot.perms.find((pe: Permnodes) => pe.name === perm.permission))
			: [];

	this.bot.perms.filter(p => p.default).forEach((perm: Permnodes) => perms.push(perm.name));
	userPerms.forEach((perm: Permnodes) => perms.push(perm.name));
	
	if (member.roles.length) {
		for (let r of member.roles) {
			const roleData: any = data.length
					? data.find((p: any) => p.roleID === r)
					: [],
				rolePerms: Permnodes[] = roleData.length
					? roleData.permissions.filter((perm: Permission) => perm.value)
							.forEach((perm: any) => this.bot.perms.find((pe: Permnodes) => pe.name === perm.permission))
					: [];

				rolePerms.forEach((perm: Permnodes) => perms.push(perm.name));
		}
	}

	perms = [...new Set(perms)];

	return [masterPerm, perm, "*"].some(p => perms.includes(p));
} */