import { exec } from '../../public/sudo-prompt'
import { AnyObject } from "../config/types.mjs";
const cmd = (cmdStr: string, options: AnyObject) => {
    return new Promise((resolve, reject) => {
        exec(cmdStr, options, (error, stdout, stderr) => {
            if (error) {
                return reject({ error, data: stdout })
            } else if (stderr) {
                return reject({ error: stderr, data: stdout })
            } else {
                return resolve({ data: stdout })
            }
        })
    })
}

export {
    cmd
}
