import { Router } from "express";
import { prisma } from "../db.mjs";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const games = await prisma.game.findMany({ orderBy: { orden: "asc" } });
    res.json(games);
  } catch (error) {
    console.error("Error fetching games:", error);
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
    await prisma.$transaction(
      orderedGames.map((game) =>
        prisma.game.update({
          where: { id: game.id },
          data: { orden: game.order },
        })
      )
    );

    res.status(200).json({ message: "Orden actualizado correctamente" });
  } catch (error) {
    console.error("Error actualizando orden:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  const { newGame } = req.body;
  const title = newGame.name;
  const synopsis = newGame.summary;
  const imageUrl = newGame.artworks;
  const igdbId = newGame.igdbId;
  const orden = newGame.order;

  console.log(newGame);

  if (!title || !synopsis || !imageUrl || !igdbId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const newGame = await prisma.game.create({
      data: {
        title,
        synopsis,
        imageUrl,
        igdbId,
        orden,
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
  try {
    const deletedGame = await prisma.game.delete({
      where: {
        igdbId: igdbId,
      },
    });
    if (!deletedGame) {
      return res.status(404).json({ error: "Game not found" });
    }
    res.status(200).json(deletedGame);
  } catch (err) {
    console.error("Error deleting game:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
