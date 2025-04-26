import { connect } from "mongoose";

export const init = async (): Promise<void> => {
  //load the database
  await connect(process.env.DATABASE || "");
};