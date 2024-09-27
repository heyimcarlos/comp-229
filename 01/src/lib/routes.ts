import { Router } from "express";
import config from "./config.js";
import axios from "axios";
import connectToDb from "./database.js";

type Movie = {
    imdbID: string;
};

const router = Router();

const omdb_api_url = `http://www.omdbapi.com/?apikey=${config.omdb_api_key}&`;

export const get_movie_details = async (imdbID: string) => {
    try {
        const { data } = await axios.get(`${omdb_api_url}&i=${imdbID}&plot=full`);
        if (data.Response === "False") {
            throw new Error(`Movie not found: ${data.Error}`);
        }
        return data;
    } catch (err) {
        console.error(err);
        throw new Error("Failed to fetch movie details");
    }
};

//  INFO: GET /movies - search movies
router.get('/movies/search', async (req, res) => {
    try {
        const { data } = await axios.get(omdb_api_url + `s=${req.query.title}`);
        if (data.Response === "False" || !data.Search || data.Search.length === 0) {
            res.sendStatus(404);
            return;
        }

        const movies = await Promise.all(data.Search.map(async (movie: Movie) => get_movie_details(movie.imdbID)));
        if (movies.length === 0) {
            res.sendStatus(404);
            return;
        }
        res.json({ data: movies });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

//  INFO: GET /movies/:title - get movie by title
router.get('/movies/search/:title', async (req, res) => {
    if (!req.params.title) {
        res.sendStatus(400);
        return;
    }

    try {
        const { data } = await axios.get(omdb_api_url + `s=${req.params.title}`);
        if (data.Response === "False" || !data.Search || data.Search.length === 0) {
            res.sendStatus(404);
            return;
        }

        const movies = await Promise.all(data.Search.map(async (movie: Movie) => get_movie_details(movie.imdbID)));
        if (movies.length === 0) {
            res.sendStatus(404);
            return;
        }
        res.json({ data: movies });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

//  INFO: POST /favorites - add to favorites
router.post('/favorites/:imdbID', async (req, res) => {
    if (!req.params.imdbID) {
        res.sendStatus(400);
        return;
    }

    try {
        const movie = await get_movie_details(req.params.imdbID);
        const db = await connectToDb();
        const combined_rating = (movie.Ratings.reduce((acc: number, rating: { Source: string, Value: string }) => {
            if (rating.Value.includes('%')) {
                acc += parseInt(rating.Value.replace('%', '')) / 10;
            }
            if (rating.Value.includes('/')) {
                const [num, den] = rating.Value.split('/').map((val) => parseFloat(val));
                if (num && den && !isNaN(num) && !isNaN(den) && den !== 0) {
                    acc += num / (den / 10);
                }
            }
            return acc;
        }, 0) / movie.Ratings.length).toFixed(2);
        movie.CombinedRating = combined_rating + '/10';
        const document = await db.collection(config.db.collection_name).insertOne(movie);
        if (document.acknowledged) {
            res.status(201).send({ data: movie });
        }
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

//  INFO: GET /favorites - get all favorites
router.get('/favorites', async (req, res) => {
    try {
        const db = await connectToDb();
        const movies = await db.collection(config.db.collection_name).find().toArray();
        res.json({ data: movies });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

//  INFO: DELETE /favorites/:imdbID - delete favorite (soft delete)
router.delete('/favorites/:imdbID', async (req, res) => {
    if (!req.params.imdbID) {
        res.sendStatus(400);
        return;
    }

    try {
        const db = await connectToDb();
        await db.collection(config.db.collection_name).updateOne({ imdbID: req.params.imdbID }, { $set: { deleted: true } });
        res.status(204).send({ message: "Deleted" });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

export default router;
