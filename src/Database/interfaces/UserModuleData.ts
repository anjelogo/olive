import { BaseModuleData } from "./BaseModuleData";

export interface UserModuleData extends BaseModuleData<"user"> {
  notifications: {
    vc: boolean;
  }
} 

export const defaultUserModuleData: UserModuleData = {
  userID: "",
  version: "1.0.0",
  enabled: true,
  notifications: {
    vc: true,
  }
};