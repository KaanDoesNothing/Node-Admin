//@ts-ignore
import * as passwd from "passwd-linux";
import { exec } from "child_process";
import os from "os";

export const calculatePercentage = (partialValue: number, totalValue: number) => {
    return (100 * partialValue) / totalValue;
}

export const getProcesses = async () => {
    return await new Promise((resolve, reject) => {
        exec("ps aux", (err, stdout, stderr) => {
            if(stdout) {
                const splitLines = stdout.trim().split("\n");

                splitLines.shift();

                const res = splitLines.map(line => {
                    const splitLine = line.split(" ").filter(line => line.length > 0);

                    return {
                        user: splitLine[0],
                        pid: parseInt(splitLine[1]),
                        cpu: parseInt(splitLine[2]),
                        memory: parseInt(splitLine[3]),
                        start: splitLine[8],
                        time: splitLine[9],
                        command: splitLine[10]
                    }
                });

                resolve(res);
            }
        });
    });
}

export const getUptime = async () => {
    return await new Promise((resolve, reject) => {
        exec(`uptime | awk -F'( |,|:)+' '{print $6,$7",",$8,"hours,",$9,"minutes."}'`, (err, stdout, stderr) => {
            if(stdout) {
                resolve(stdout.trim());
            }
        });
    });
}


export const getCPUModel = () => {
    return os.cpus()[0].model;
}

// export const getCPUModel = async () => {
//     return await new Promise((resolve, reject) => {
//         exec(`lscpu | grep 'Model name' | cut -f 2 -d ":" | awk '{$1=$1}1'`, (err, stdout, stderr) => {
//             if(stdout) {
//                 resolve(stdout.trim());
//             }
//         });
//     });
// }

export const getCPUUsage = async (): Promise<number> => {
    return await new Promise((resolve, reject) => {
        exec(`grep 'cpu ' /proc/stat | awk '{usage=($2+$4)*100/($2+$4+$5)} END {print usage "%"}'`, (err, stdout, stderr) => {
            if(stdout) {
                resolve(parseInt(stdout.trim().split(".")[0]));
            }
        });
    });
}

export const getDistro = async () => {
    return await new Promise((resolve, reject) => {
        exec("( lsb_release -ds || cat /etc/*release || uname -om ) 2>/dev/null | head -n1", (err, stdout, stderr) => {
            if(stdout) {
                resolve(stdout.trim());
            }
        });
    });
}

export const getHardDrives = async () => {
    return await new Promise((resolve, reject) => {
        exec("df -m", (err, stdout, stderr) => {
            if(stdout) {
                const splitLines = stdout.trim().split("\n");

                splitLines.shift();

                const res = splitLines.map(line => {
                    const splitLine = line.split(" ").filter(line => line.length > 0);

                    return {
                        name: splitLine[0],
                        size: parseInt(splitLine[1]),
                        used: parseInt(splitLine[2]),
                        free: parseInt(splitLine[3]),
                        mounted: splitLine[5],
                    }
                });

                resolve(res);
            }
        });
    });
}

export const getMemory = async () => {
    return await new Promise((resolve, reject) => {
        exec("free -m", (err, stdout, stderr) => {
            if(stdout) {
                const splitLines = stdout.trim().split("\n");

                splitLines.shift();

                const res = splitLines.map(line => {
                    const splitLine = line.split(" ").filter(line => line.length > 0);

                    return {
                        name: splitLine[0].split(":")[0],
                        size: parseInt(splitLine[1]),
                        used: parseInt(splitLine[2]),
                        free: parseInt(splitLine[3])
                    }
                });

                resolve(res);
            }
        });
    });
}

export const userExists = async (username: string) => {
    return await new Promise((resolve, reject) => {
        passwd.userExist(username, (err: Error, res: boolean) => {
            if(err) reject(false);

            resolve(res);
        });
    });
}

export const checkPassword = async (username: string, password: string) => {
    return await new Promise((resolve, reject) => {
        passwd.checkPassword(username, password, (err: Error, res: boolean) => {
            if(err) reject(false);

            resolve(res);
        });
    });
}