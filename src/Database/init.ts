import { connect } from "mongoose";

const init = async (): Promise<void> => {
	//load the database
	await connect(process.env.DATABASE!);
    
    
};