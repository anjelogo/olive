import { Router } from "express";
import ExtendedClient from "../../Base/Client";
import Service, { InputField } from "../../Base/Service";

export default class RoleService extends Service {

  routeHandlers: Record<string, (req: any, res: any) => void> = {
    "/": (req, res) => {
      res.send("Role Service is working!");
    }
  };

  updateData = (params: any, data: any): Promise<any> =>{
    // Implement data update logic here
    return new Promise((resolve, reject) => {
      try {
        console.log("Updating data with params:", params, "and data:", data);
        resolve({ success: true });
      } catch (error) {
        reject(error);
      }
    });
  }

  protected bot: ExtendedClient;
  protected router = Router();
  protected fields: InputField[] = [
    {
      label: "Role Save on Leave",
      description: "Save the role when the user leaves the server",
      type: "checkbox"
    }
  ]

  constructor(bot: ExtendedClient) {
    super(bot);

    this.bot = bot;
  }
}