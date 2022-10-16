import express from "express";
import http from "http";
import path from "path";
import socketIO from "socket.io";
import { getHardDrives, getMemory, calculatePercentage, getCPUUsage, getDistro, getCPUModel, getUptime, getProcesses, checkPassword } from "./utils";
import * as pty from "node-pty";
import fs from "fs/promises";
import expressSession from "express-session";
import "./background";

const app = express();
const server = http.createServer(app);
const socket = new socketIO.Server(server);

app.use(express.json({}));
app.use(express.urlencoded({extended: true}));

const sessionMiddleware = expressSession({
    secret: "hmmm",
    resave: false,
    saveUninitialized: false
});

app.use(sessionMiddleware);
  

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "../views"));

app.locals.modules = {
    calculatePercentage
}

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {
    const {user, password} = req.body;

    const isCorrect = await checkPassword(user, password);

    if(!isCorrect) return res.render("login", {error: "Invalid user | password"});

    //@ts-ignore
    req.session.authenticated = true;
    
    return res.redirect("/");
});

app.use((req, res, next) => {
    //@ts-ignore
    if(!req.session.authenticated) return res.redirect("/login");

    next();
});

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

app.get("/file_manager", async (req, res) => {
    const directory = req.query.path?.toString() || "/";
    
    const fetched_directory = await fs.readdir(directory);

    const directory_content = await Promise.all(fetched_directory.map(async (row: string) => {
        const type = await fs.lstat(path.join(directory, row));

        return {
            name: row,
            isFile: type.isFile(),
            isFolder: type.isDirectory()
        }
    }));

    return res.render("file_manager", {directory, directory_content});
});

app.get("/force_update", async (req, res) => {
    const shell = pty.spawn("bash", [], {
        name: "xterm-color",
        cols: 100,
        rows: 40
    });

    shell.onData((e) => {
        console.log(e);
    });

    shell.write("git pull && yarn && tsc\n");

    setTimeout(() => {
        process.exit();
    }, 30000);

    return res.send("Server will restart in 30 seconds");
});

const wrap = (middleware: any) => (socket: any, next: any) => middleware(socket.request, {}, next);

socket.use(wrap(sessionMiddleware));

socket.use((socket, next) => {
    //@ts-ignore
    const session = socket.request.session;
    if (session && session.authenticated) {
      next();
    } else {
      next(new Error("unauthorized"));
    }
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