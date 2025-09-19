import { BaseModuleData } from "./BaseModuleData";

export interface UserModuleData extends BaseModuleData<"user"> {
  userID: string;
  notifications: {
    vc: boolean;
  }
} 