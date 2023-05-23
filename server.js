"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const json_server_1 = __importDefault(require("json-server"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var cors = require("cors");
const server = json_server_1.default.create();
const router = json_server_1.default.router("src/tmp/db.json");
const middlewares = json_server_1.default.defaults();
const SECRET_KEY = "secret@@@@";
server.use(middlewares);
server.use(json_server_1.default.bodyParser);
// Função para gerar o token JWT
function generateToken(data) {
    return jsonwebtoken_1.default.sign(data, SECRET_KEY);
}
server.get("/", (req, res) => {
    res.status(200).json({ value: "API" });
});
// Rota de login
server.post("/login", (req, res) => {
    const { username, password } = req.body;
    const user = router.db.get("users").find({ username, password }).value();
    if (user) {
        const token = generateToken({ id: user.id });
        res.status(200).json({ token });
    }
    else {
        res.sendStatus(401);
    }
});
// Middleware de autenticação JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token == null)
        return res.sendStatus(401);
    jsonwebtoken_1.default.verify(token, SECRET_KEY, (err, user) => {
        if (err)
            return res.sendStatus(403);
        req.user = user;
        next();
    });
}
//Decodificat o token
function decodeToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        return decoded;
    }
    catch (error) {
        return null;
    }
}
//GET ALL EVENTS
server.get("/showEvents", (req, res) => {
    const events = router.db.get("events");
    if (events) {
        res.status(200).json({ events });
    }
    else {
        res.sendStatus(400);
    }
});
//GET EVENTS CREATED BY LOGGED USER
server.get("/showEventsCreated", authenticateToken, (req, res) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const tokenDecoded = decodeToken(token);
    const events = router.db
        .get("events")
        .filter({ created_by: tokenDecoded.id })
        .value();
    if (events) {
        res.status(200).json({ events });
    }
    else {
        res.sendStatus(400);
    }
});
//CREATE NEW EVENT
server.post("/createEvent", authenticateToken, (req, res) => {
    const { title, description, price, location } = req.body;
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const tokenDecoded = decodeToken(token);
    const newEvent = {
        id: Date.now(),
        title,
        description,
        price,
        location,
        created_by: tokenDecoded.id,
    };
    router.db.get("events").push(newEvent).write();
    res.status(201).json({ newEvent });
});
server.use(router);
server.use(cors());
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`JSON-Server está rodando em http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map