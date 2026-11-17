# boxdlist-proxy

A small serverless function that looks up film details on TMDB for [BoxdList](https://github.com/goncaloo07/BoxdList).

It keeps the TMDB API key on the server, so the key is never shipped inside the desktop app.

## How it works

BoxdList sends a film name and year. The function searches TMDB, takes the best match and sends back only the genres, the runtime and the synopsis.

## Endpoint

```
GET /api/movie?name=Amelie&year=2001
```

| Parameter | Required | Notes |
| --- | --- | --- |
| `name` | yes | Film title, up to 200 characters |
| `year` | no | If the film has no year, leave it out |

Example response:

```json
{
  "genres": ["Comedy", "Romance"],
  "runtime": 122,
  "overview": "..."
}
```

`runtime` is in minutes. TMDB may return an empty `overview` or a missing `runtime` for some films.

### Errors

| Status | Meaning |
| --- | --- |
| `400` | `name` is missing, empty or longer than 200 characters |
| `404` | TMDB has no film that matches |
| `500` | The `TMDB_KEY` variable is not set |
| `502` | TMDB did not answer or answered with an error |

Successful answers are cached by Vercel for one day. Errors are never cached.

## Deploy on Vercel

1. Import this repository in Vercel.
2. In **Settings > Environment Variables**, add `TMDB_KEY` with your TMDB API key (the v3 one).
3. Deploy. If you change the variable later, deploy again so it takes effect.

The key is never stored in this repository.

## Disclaimer

This product uses the TMDB API but is not endorsed or certified by TMDB.

## License

[MIT](LICENSE.md)