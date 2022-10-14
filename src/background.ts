// import { CPU_Usage } from "./entities/cpu";
// import { getCPUUsage } from "./utils";

// setInterval(async () => {
//     const cpuUsage = await getCPUUsage();

//     if(cpuUsage) {
//         const log = CPU_Usage.create({usage: cpuUsage});

//         await log.save();

//         console.log(log);
//     }
// }, 1000);