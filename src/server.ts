import jsonServer from "json-server";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
var cors = require("cors");

const server = jsonServer.create();
const router = jsonServer.router("tmp/db.json");
const middlewares = jsonServer.defaults();

const SECRET_KEY = "secret@@@@";

server.use(middlewares);
server.use(jsonServer.bodyParser);

// Função para gerar o token JWT
function generateToken(data: any) {
  return jwt.sign(data, SECRET_KEY);
}

server.get("/", (req: Request, res: Response) => {
  res.status(200).json({ value: "API" });
});

// Rota de login
server.post("/login", (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = router.db.get("users").find({ username, password }).value();

  if (user) {
    const token = generateToken({ id: user.id });
    res.status(200).json({ token });
  } else {
    res.sendStatus(401);
  }
});

// Middleware de autenticação JWT
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

//Decodificat o token
function decodeToken(token: string) {
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return decoded;
  } catch (error) {
    return null;
  }
}

//GET ALL EVENTS
server.get("/showEvents", (req: Request, res: Response) => {
  const events = router.db.get("events");

  if (events) {
    res.status(200).json({ events });
  } else {
    res.sendStatus(400);
  }
});

//GET EVENTS CREATED BY LOGGED USER
server.get(
  "/showEventsCreated",
  authenticateToken,
  (req: Request, res: Response) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const tokenDecoded: any = decodeToken(token);

    const events = router.db
      .get("events")
      .filter({ created_by: tokenDecoded.id })
      .value();
    if (events) {
      res.status(200).json({ events });
    } else {
      res.sendStatus(400);
    }
  }
);

//CREATE NEW EVENT
server.post(
  "/createEvent",
  authenticateToken,
  (req: Request, res: Response) => {
    const { title, description, price, location } = req.body;

    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const tokenDecoded: any = decodeToken(token);

    const newEvent = {
      id: Date.now(),
      title,
      description,
      price,
      location,
      created_by: tokenDecoded.id,
    };

    const write = router.db.get("events").push(newEvent).write();

    if (write) {
      res.status(200).json({ result: "Adicionado" });
    } else {
      res.status(200).json({ result: "Adicionado" });
    }
  }
);

server.use(router);
server.use(cors());

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`JSON-Server está rodando em http://localhost:${PORT}`);
});
