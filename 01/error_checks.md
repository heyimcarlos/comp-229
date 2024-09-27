# Error Checks (Outline of improvements)

## Error 1 - Route `GET /movies` - search movies

Validating the query parameter `title` would be helpful.

```typescript
    if (!req.query.title) {
        res.sendStatus(400);
        return;
    }
```

## Error 2 - Route `GET /movies` - search movies

A list of promises are being awaited as a batch. There could be better error handling to return
errors for specific movies that fail to fetch.

```typescript
   const movies = await Promise.all(data.Search.map(async (movie: Movie) => get_movie_details(movie.imdbID)));
```

## Error 3 - Route `GET /favorites` - get all favorites

This route is missing an error check for the find operation. `toArray` might be called on null.

```typescript
   const movies = await db.collection(config.db.collection_name).find().toArray();
```

## Error 4 - Route `DELETE /favorites/:imdbID` - delete favorite (soft delete)

The update operation is missing an error check. The response should be a 500 if the soft delete fails.
Also, the response there's potential for a 404 status response.

```typescript
   await db.collection(config.db.collection_name).updateOne({ imdbID: req.params.imdbID }, { $set: { deleted: true } });
   res.status(204).send({ message: "Deleted" });
```
