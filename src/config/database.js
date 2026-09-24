import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

class Database{
    constructor(){
        if(!Database.instance){
        this.pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port:  process.env.DB_PORT ? Number(process.env.DB_PORT): 3306,
            waitForConnections:true,
            connectionLimit: 10,
            queueLimit: 0
        });
        Database.instance = this;
       }
       return Database.instance;
    }
    getPool(){
        return this.pool;
    }

    async getConnection(){
        return await this.pool.getConnection();
    }
}

const dbInstance = new Database();
Object.freeze(dbInstance);

export default dbInstance;