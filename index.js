require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { default: axios } = require("axios");

const app = express();

app.use(express.json());
app.use(cors());

const CLIENT_ID = process.env.CLIENT_ID;
let ACCESS_TOKEN = null;
const BASE_URL = process.env.BASE_URL;
const SECRET = process.env.SECRET;
const ARTWORK_URL = process.env.ARTWORK_URL;

let items = [
  { id: 1, name: "Item 1" },
  { id: 2, name: "Item 2" },
];

const getAccessToken = async () => {
  try {
    const response = await axios.post(
      "https://id.twitch.tv/oauth2/token",
      null,
      {
        params: {
          client_id: CLIENT_ID,
          client_secret: SECRET,
          grant_type: "client_credentials",
        },
      }
    );
    ACCESS_TOKEN = response.data.access_token;
  } catch (error) {
    console.error("error obteniendo access token", error.response.data);
    return null;
  }
};

(async () => {
  await getAccessToken();
})();

const fetchFromIGDB = async (query) => {
  try {
    const response = await axios.post(BASE_URL, query, {
      headers: {
        "Client-ID": CLIENT_ID,
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "text/plain",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error en la consulta a IGDB", error.response.data);
    return [];
  }
};

const fetchArtwork = async (id) => {
  try {
    const response = await axios.post(
      ARTWORK_URL,
      `fields id, url, image_id; where id = ${id};`,
      {
        headers: {
          "Client-ID": CLIENT_ID,
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "text/plain",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error en la consulta a IGDB", error.response.data);
    return [];
  }
};

app.get("/items", (req, res) => {
  res.json(items);
});

app.get("/search", async (req, res) => {
  const { name } = req.query;
  console.log(name);
  if (!name)
    return res.status(400).json({ error: "falta el parámetro 'title'" });

  const query = `search "${name}"; fields summary, name, artworks; limit 20;`;
  const games = await fetchFromIGDB(query);
  res.json(games);
});

app.get("/artworks", async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "falta el parámetro 'id'" });

  const artworks = await fetchArtwork(id);
  console.log(">>>>>>>>>>>>>>", artworks);
  res.json(artworks);
});

app.post("/items", (req, res) => {
  const newItem = { id: items.length + 1, ...req.body };
  items.push(newItem);
  res.status(201).json(newItem);
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
