const TMDB = "https://api.themoviedb.org/3";

// Searches one kind ("movie" or "tv") and returns the id of the best match, or null
async function findId(kind, name, year, key) {
    let url = `${TMDB}/search/${kind}?api_key=${key}&query=${encodeURIComponent(name)}`;
    if (year) {
        // movies use "year", series use "first_air_date_year"
        const param = kind === "movie" ? "year" : "first_air_date_year";
        url += `&${param}=${encodeURIComponent(year)}`;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error("TMDB error");   // caught below, becomes a 502
    const data = await response.json();
    return data.results.length > 0 ? data.results[0].id : null;   // the first result is the best match
}

module.exports = async (req, res) => {
    // Vercel runs this function every time someone opens the address
    const { name, year } = req.query;   // the values after the "?" in the link
    const key = process.env.TMDB_KEY;   // the secret key, stored in Vercel

    if (typeof name !== "string" || !name || name.length > 200) {return res.status(400).json({ error: "Missing or invalid name" });}
    if (!key){return res.status(500).json({ error: "Server is not configured"});}

    try {
        // movies first, then series if no movie matches
        let kind = "movie";
        let id = await findId("movie", name, year, key);
        if (id === null) {
            kind = "tv";
            id = await findId("tv", name, year, key);
        }
        if (id === null) {return res.status(404).json({ error: "Not found"});}   // the app relies on this exact text

        const response = await fetch(`${TMDB}/${kind}/${id}?api_key=${key}&language=en-US&append_to_response=external_ids`);
        if (!response.ok) throw new Error("TMDB error");
        const details = await response.json();

        const result = {
            genres: (details.genres || []).map(g => g.name),   // a simple list of names, like ["Comedy", "Romance"]
            // series only have the length of one episode, so it is left out
            runtime: kind === "movie" ? details.runtime : null,
            overview: details.overview,   // the synopsis
            // some titles have no IMDb id, so fall back to null
            imdb_id: details.external_ids?.imdb_id || null,
        };
        res.setHeader("Cache-Control", "s-maxage=86400");   // Vercel keeps this answer for 1 day
        res.status(200).json(result);
    } catch (error) {
        res.status(502).json({ error: "TMDB request failed" });
    }
};