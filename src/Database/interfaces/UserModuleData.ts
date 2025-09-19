import { BaseModuleData } from "./BaseModuleData";

export interface UserModuleData extends BaseModuleData<"user"> {
  notifications: {
    vc: boolean;
  }
} 