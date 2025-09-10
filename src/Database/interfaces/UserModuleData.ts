import { BaseModuleData } from "./BaseModuleData";

export interface UserModuleData extends BaseModuleData {
  userID: string;
  notifications: {
    vc: boolean;
  }
}