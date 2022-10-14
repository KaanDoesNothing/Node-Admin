import express from "express";
import http from "http";
import path from "path";
import socketIO from "socket.io";
import { getHardDrives, getMemory, calculatePercentage, getCPUUsage, getDistro, getCPUModel, getUptime, getProcesses } from "./utils";
import * as pty from "node-pty";

const app = express();
const server = http.createServer(app);
const socket = new socketIO.Server(server);

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "../views"));

app.locals.modules = {
    calculatePercentage
}

app.get("/", async (req, res) => {
    res.render("overview", {
        hard_drives: await getHardDrives(),
        memory: await getMemory(),
        cpu: {
            model: getCPUModel(),
            usage: await getCPUUsage()
        },
        system: {
            distro: await getDistro(),
            uptime: await getUptime()
        }
    });
});

app.get("/processes", async (req, res) => {
    res.render("processes", {
        processes: await getProcesses()
    })
});

app.get("/terminal", (req, res) => {
    res.render("terminal");
});

app.get("/terminal/iframe", (req, res) => {
    res.render("terminal_iframe");
});

socket.on("connection", (socket_client) => {
    const shell = pty.spawn("bash", [], {
        name: "xterm-color",
        cols: 100,
        rows: 40
    });

    shell.onData((e) => {
        socket_client.emit("message", {data: e});
    });

    socket_client.on("message", (e) => {
        if(e.data) {
            shell.write(e.data);     
        }else if(e.size) {
            shell.resize(e.size.cols, e.size.rows);
        }
    });
    
    socket_client.on("disconnect", () => shell.kill());
});

server.listen(7030);