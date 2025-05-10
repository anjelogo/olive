import { connect } from "mongoose";
import ExtendedClient from "../Base/Client";

export const init = async (bot: ExtendedClient): Promise<void> => {
  //load the database
  await connect((process.env.DATABASE || "").replace("{db}", bot.name).replace(" ", "_"));
};