import path from 'path'
import { open } from 'sqlite'
import sqlite3 from 'sqlite3'
import { isPathExists } from '../utils/isPathExists'
import { DB_FILE, DB_MEMORY } from '@/common/Constants'
import { asyncExec } from '@/common/utils/asyncExec'

export type DbClient = ReturnType<typeof open>

let globalDbClient: DbClient | null = null

export function getDbClient(): DbClient {
    if (!globalDbClient) {
        globalDbClient = createDbClient(DB_FILE)
    }

    return globalDbClient
}

export async function createDbClient(filePath: string): DbClient {
    if (DEFINE.IS_DEV) {
        sqlite3.verbose()
    }

    await createSqliteDbIfNotExists(filePath)

    return open({
        filename: filePath,
        driver: sqlite3.Database,
    })
}

export async function createSqliteDbIfNotExists(filePath: string): Promise<void> {
    if (filePath === DB_MEMORY) {
        return
    }

    const absFilePath = path.resolve(filePath)
    const dir = path.dirname(filePath)

    if (await isPathExists(absFilePath)) {
        return
    }

    console.info(`Sqlite DB "${absFilePath}" does not exist. Going to create it`)
    await asyncExec(`mkdir -p ${dir}`)
    await asyncExec(`touch ${filePath}`)
}
