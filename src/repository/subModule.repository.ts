import { InsertSubModuleToDBError } from "../exceptions/subModules.exceptions";
import type { ISubModuleType } from "../types/types";
import db from "./db";
import { subModules } from "./schema";

export async function insertSubModuleToDB(payload: {parsedRepoId: number; filePath: string; moduleName: string; moduleType: ISubModuleType}){
    try {
        await db.insert(subModules).values(payload);
    } catch (error) {
        throw new InsertSubModuleToDBError("Failed to insert sub modules in db", { cause: (error as Error).message })
    }
}