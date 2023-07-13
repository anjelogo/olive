import { connect } from "mongoose";
import { Auth } from "../resources/auth";

const init = async (): Promise<void> => {
	//load the database
	await connect(Auth.database);
    
    
};