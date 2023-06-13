import { createConnection } from "mongo-strict"
import { Auth } from "../resources/auth"

const init = async (): Promise<void> => {
    //load the database
    createConnection({
        uri: Auth.database
    });
    
    
}