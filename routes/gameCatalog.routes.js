import { Router } from "express";
import { prisma } from "../db.mjs";
import { PlayStatus } from "@prisma/client";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const games = await prisma.game.findMany({
      where: {
        playStatus: { in: [PlayStatus.BACKLOG, PlayStatus.PLAYING] },
      },
      orderBy: { orden: "asc" },
    });
    res.json(games);
  } catch (error) {
    console.error("Error fetching games:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/all", async (req, res) => {
  try {
    const games = await prisma.game.findMany({ orderBy: { orden: "asc" } });
    res.json(games);
  } catch (error) {
    console.error("Error fetching games:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/current", async (req, res) => {
  try {
    const currentGame = await prisma.game.findFirst({
      where: { playStatus: "PLAYING" },
    });
    if (!currentGame) {
      return res.status(404).json({ error: "Current game not found" });
    }
    res.status(200).json(currentGame);
  } catch (err) {
    console.error("Error fetching current game:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/total", async (req, res) => {
  try {
    const total = await prisma.game.count();
    res.json({ total });
  } catch (error) {
    console.error("Error fetching total games:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/reorder", async (req, res) => {
  const { orderedGames } = req.body;

  if (!Array.isArray(orderedGames)) {
    return res.status(400).json({ error: "Invalid payload: expected array" });
  }

  try {
    // Encontrar el que tendrá orden 1
    const firstGameData = orderedGames.find((game) => game.order === 1);

    if (!firstGameData) {
      return res.status(400).json({ error: "No game has orden 1" });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Actualizar todos los orden
      await Promise.all(
        orderedGames.map((game) =>
          tx.game.update({
            where: { id: game.id },
            data: { orden: game.order },
          })
        )
      );

      // 2. Establecer PLAYING al nuevo orden 1
      await tx.game.update({
        where: { id: firstGameData.id },
        data: { playStatus: PlayStatus.PLAYING },
      });

      // 3. Cambiar a BACKLOG los que estaban en PLAYING pero ya no son orden 1
      await tx.game.updateMany({
        where: {
          id: { not: firstGameData.id },
          playStatus: PlayStatus.PLAYING,
        },
        data: { playStatus: PlayStatus.BACKLOG },
      });
    });

    res
      .status(200)
      .json({ message: "Orden y estado actualizados correctamente" });
  } catch (error) {
    console.error("Error actualizando orden y estado:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  const igdbId = parseInt(req.params.id);

  if (isNaN(igdbId)) {
    return res.status(400).json({ error: "Invalid Id" });
  }

  try {
    const currentGame = await prisma.game.findUnique({
      where: { igdbId },
    });

    if (!currentGame) {
      return res.status(404).json({ error: "Game not found" });
    }

    if (currentGame.playStatus !== PlayStatus.PLAYING) {
      return res.status(400).json({ error: "Game is not currently PLAYING" });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Marcar el juego actual como COMPLETED
      await tx.game.update({
        where: { igdbId },
        data: { playStatus: PlayStatus.COMPLETED },
      });

      // 2. Buscar el siguiente juego (orden === 2)
      const nextGame = await tx.game.findFirst({
        where: {
          orden: 2,
          playStatus: PlayStatus.BACKLOG,
        },
      });

      // 3. Si hay siguiente juego, lo marcamos como PLAYING y orden 1
      if (nextGame) {
        await tx.game.update({
          where: { id: nextGame.id },
          data: {
            playStatus: PlayStatus.PLAYING,
            orden: 1,
          },
        });
      }

      // 4. A todos los juegos con orden > 1, les restamos 1
      await tx.game.updateMany({
        where: {
          orden: { gt: 1 },
        },
        data: {
          orden: {
            decrement: 1,
          },
        },
      });
    });

    res
      .status(200)
      .json({ message: "Juego finalizado y orden actualizado correctamente" });
  } catch (err) {
    console.error("Error updating game:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  const { newGame } = req.body;
  const title = newGame.name;
  const synopsis = newGame.summary;
  const artworks = newGame.artworks;
  const igdbId = newGame.igdbId;
  const orden = newGame.order;

  console.log(newGame);

  if (!title || !synopsis || !artworks || !igdbId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const newGame = await prisma.game.create({
      data: {
        title,
        synopsis,
        artworks,
        igdbId,
        orden,
        playStatus: orden === 1 ? PlayStatus.PLAYING : PlayStatus.BACKLOG,
      },
    });
    res.status(201).json(newGame);
  } catch (error) {
    console.error("Error creating game:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/", async (req, res) => {
  const { igdbId } = req.body;

  if (!igdbId || isNaN(igdbId)) {
    return res.status(400).json({ error: "Invalid or missing igdbId" });
  }

  try {
    const existingGame = await prisma.game.findUnique({
      where: { igdbId: parseInt(igdbId) },
    });

    if (!existingGame) {
      return res.status(404).json({ error: "Game not found" });
    }

    const deletedGame = await prisma.game.delete({
      where: { igdbId: parseInt(igdbId) },
    });

    res.status(200).json(deletedGame);
  } catch (err) {
    console.error("Error deleting game:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
