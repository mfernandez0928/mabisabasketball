import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
let db: any = null;
if (!admin.apps.length) {
  // Only try to initialize if we are likely to have credentials
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_CONFIG) {
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
      db = admin.firestore();
    } catch (e) {
      console.log("Firebase initialization skipped. Using local mode.");
    }
  } else {
    console.log("Mabisa Server: Local Data Mode Active");
  }
}
const SETTINGS_DOC = "settings/app_data";
const DATA_FILE = path.join(__dirname, "data.json");

const INITIAL_DATA = {
  players: [
    {
      id: 'p1',
      name: 'J-Buckets',
      points: 28,
      rebounds: 8,
      assists: 12,
      steals: 3,
      blocks: 1,
      mvps: 5,
      wins: 12,
      image: 'https://picsum.photos/seed/player1/800/1000',
    },
    {
      id: 'p2',
      name: 'Big Diesel',
      points: 18,
      rebounds: 15,
      assists: 4,
      steals: 1,
      blocks: 5,
      mvps: 3,
      wins: 10,
      image: 'https://picsum.photos/seed/player2/800/1000',
    },
    {
      id: 'p3',
      name: 'Flash',
      points: 22,
      rebounds: 4,
      assists: 15,
      steals: 6,
      blocks: 0,
      mvps: 2,
      wins: 14,
      image: 'https://picsum.photos/seed/player3/800/1000',
    },
  ],
  games: [
    {
      id: 'g1',
      date: 'Feb 20, 2026',
      location: 'Hoops Dome, QC',
      teamWhite: {
        score: 88,
        players: [
          { name: 'J-Buckets', pts: 28 },
          { name: 'Coach Mike', pts: 15 },
          { name: 'Flash', pts: 22 },
          { name: 'Z-Man', pts: 12 },
          { name: 'D-Rose', pts: 11 },
        ],
      },
      teamBlue: {
        score: 92,
        players: [
          { name: 'Big Diesel', pts: 18 },
          { name: 'Skywalker', pts: 25 },
          { name: 'The Blur', pts: 20 },
          { name: 'Tank', pts: 14 },
          { name: 'Ghost', pts: 15 },
        ],
      },
      mvpId: 'Big Diesel',
    }
  ],
  upcomingGame: {
    id: 'next',
    date: '2026-02-27T19:00:00',
    location: 'Hoops Dome, Quezon City',
    mapUrl: '#',
    totalSlots: 15,
    filledSlots: 12,
    entranceFee: '₱250.00',
    reservedPlayers: [],
    pendingReservations: [],
    pendingPayments: [],
  },
  awards: [],
  socialMessages: [
    { user: 'Coach Mike', msg: 'Team Blue got lucky last night. We coming for that rematch!', time: '2h ago' },
    { user: 'J-Buckets', msg: 'Who wants to guard me next Friday? 🏀💨', time: '5h ago' },
  ],
  socialPosts: [
    {
      id: 'sp1',
      user: 'Mabisa Basketball',
      msg: 'The energy at Hoops Dome was insane last night! Big thanks to everyone who showed up. See you all next Friday! 🏀🔥',
      time: 'Feb 20, 2026',
      image: 'https://picsum.photos/seed/mabisa1/800/600',
      url: 'https://www.facebook.com/mabisabasketball'
    }
  ]
};

// Helper to read local data (fallback)
const readLocalData = () => {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_DATA, null, 2));
    return INITIAL_DATA;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
};

// Helper to write local data (fallback)
const writeLocalData = (data: any) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// Helper to read data
const readData = async () => {
  if (!db) return readLocalData();
  try {
    const doc = await db.doc(SETTINGS_DOC).get();
    if (!doc.exists) {
      await db.doc(SETTINGS_DOC).set(INITIAL_DATA);
      return INITIAL_DATA;
    }
    return doc.data();
  } catch (e: any) {
    if (!e.message.includes("PERMISSION_DENIED")) {
      console.warn("Firestore read error:", e.message);
    }
    return readLocalData();
  }
};

// Helper to write data
const writeData = async (data: any) => {
  if (!db) {
    writeLocalData(data);
    return;
  }
  try {
    await db.doc(SETTINGS_DOC).set(data, { merge: true });
  } catch (e: any) {
    if (!e.message.includes("PERMISSION_DENIED")) {
      console.warn("Firestore write error:", e.message);
    }
    writeLocalData(data);
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/data", async (req, res) => {
    const data = await readData();
    res.json(data);
  });

  app.post("/api/data", async (req, res) => {
    const newData = req.body;
    await writeData(newData);
    res.json({ status: "ok", data: newData });
  });

  app.post("/api/reserve", async (req, res) => {
    const { firstName, lastName, age, positions, paymentMethod, screenshotUrl } = req.body;
    const data: any = await readData();
    const newReservation = {
      id: Math.random().toString(36).substr(2, 9),
      firstName,
      lastName,
      age,
      positions,
      paymentMethod,
      screenshotUrl,
      timestamp: new Date().toISOString()
    };
    
    if (paymentMethod === 'GCash') {
      data.upcomingGame.pendingPayments.push(newReservation);
    } else {
      // Cash goes to pendingReservations for admin to confirm at venue
      if (!data.upcomingGame.pendingReservations) {
        data.upcomingGame.pendingReservations = [];
      }
      data.upcomingGame.pendingReservations.push(newReservation);
    }
    
    await writeData(data);
    res.json({ status: "ok", reservation: newReservation });
  });

  app.post("/api/admin/confirm-reservation", async (req, res) => {
    const { id } = req.body;
    const data: any = await readData();
    const reservationIndex = data.upcomingGame.pendingReservations.findIndex((r: any) => r.id === id);
    
    if (reservationIndex > -1) {
      const reservation = data.upcomingGame.pendingReservations[reservationIndex];
      data.upcomingGame.pendingReservations.splice(reservationIndex, 1);
      data.upcomingGame.reservedPlayers.push({
        firstName: reservation.firstName,
        lastName: reservation.lastName,
        age: reservation.age,
        positions: reservation.positions
      });
      data.upcomingGame.filledSlots = (data.upcomingGame.filledSlots || 0) + 1;

      const fullName = `${reservation.firstName} ${reservation.lastName}`.trim();
      const playerExists = data.players.some((p: any) => p.name.toLowerCase() === fullName.toLowerCase());
      
      if (!playerExists) {
        data.players.push({
          id: 'p' + Math.random().toString(36).substr(2, 5),
          name: fullName,
          points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, mvps: 0, wins: 0,
          image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}`
        });
      }

      await writeData(data);
      res.json({ status: "ok" });
    } else {
      res.status(404).json({ status: "error", message: "Reservation not found" });
    }
  });

  app.post("/api/admin/reject-reservation", async (req, res) => {
    const { id } = req.body;
    const data: any = await readData();
    const reservationIndex = data.upcomingGame.pendingReservations.findIndex((r: any) => r.id === id);
    
    if (reservationIndex > -1) {
      data.upcomingGame.pendingReservations.splice(reservationIndex, 1);
      await writeData(data);
      res.json({ status: "ok" });
    } else {
      res.status(404).json({ status: "error", message: "Reservation not found" });
    }
  });

  app.post("/api/admin/confirm-payment", async (req, res) => {
    const { id } = req.body;
    const data: any = await readData();
    const paymentIndex = data.upcomingGame.pendingPayments.findIndex((p: any) => p.id === id);
    
    if (paymentIndex > -1) {
      const payment = data.upcomingGame.pendingPayments[paymentIndex];
      data.upcomingGame.pendingPayments.splice(paymentIndex, 1);
      data.upcomingGame.reservedPlayers.push({
        firstName: payment.firstName,
        lastName: payment.lastName,
        age: payment.age,
        positions: payment.positions
      });
      data.upcomingGame.filledSlots = (data.upcomingGame.filledSlots || 0) + 1;

      const fullName = `${payment.firstName} ${payment.lastName}`.trim();
      const playerExists = data.players.some((p: any) => p.name.toLowerCase() === fullName.toLowerCase());
      
      if (!playerExists) {
        data.players.push({
          id: 'p' + Math.random().toString(36).substr(2, 5),
          name: fullName,
          points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, mvps: 0, wins: 0,
          image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}`
        });
      }

      await writeData(data);
      res.json({ status: "ok" });
    } else {
      res.status(404).json({ status: "error", message: "Payment not found" });
    }
  });

  app.post("/api/admin/reject-payment", async (req, res) => {
    const { id } = req.body;
    const data: any = await readData();
    const paymentIndex = data.upcomingGame.pendingPayments.findIndex((p: any) => p.id === id);
    
    if (paymentIndex > -1) {
      data.upcomingGame.pendingPayments.splice(paymentIndex, 1);
      await writeData(data);
      res.json({ status: "ok" });
    } else {
      res.status(404).json({ status: "error", message: "Payment not found" });
    }
  });

  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    if (password === "mabisa2026") {
      res.json({ success: true, token: "admin-token-123" });
    } else {
      res.status(401).json({ success: false, message: "Invalid password" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
