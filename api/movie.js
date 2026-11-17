module.exports = async (req, res) => {
    // Vercel runs this function every time someone opens the address
    const { name, year } = req.query;   // the values after the "?" in the link
    const key = process.env.TMDB_KEY;   // the secret key, stored in Vercel

    if (typeof name !== "string" || !name || name.length > 200) {return res.status(400).json({ error: "Missing or invalid name" });}
    if (!key){return res.status(500).json({ error: "Server is not configured"});}

    let id;   // declared outside the try, so we can use it after it
    try {
        let url = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${encodeURIComponent(name)}`;
        if (year) url += `&year=${encodeURIComponent(year)}`;   // only if the film has a year
        const response = await fetch(url);   // ask TMDB and wait for the answer
        if (!response.ok){return res.status(502).json({ error: "TMDB error. Might be a bad key."});}
        const data = await response.json();  // turn the answer into an object
        if (data.results.length === 0){return res.status(404).json({ error: "Not found"})}
        id = data.results[0].id;   // the first result is the best match
    } catch (error) {
        return res.status(502).json({ error: "TMDB request failed" });
    }
    let details;
    try {
        const detailsUrl = `https://api.themoviedb.org/3/movie/${id}?api_key=${key}&language=en-US`;
        const response = await fetch(detailsUrl);
        if (!response.ok){return res.status(502).json({ error: "TMDB error. Might be a bad key."});}
        details = await response.json();
    } catch (error) {
        return res.status(502).json({ error: "TMDB request failed" });
    }
    const result = {
        genres: details.genres.map(g => g.name),   // a simple list of names, like ["Comedy", "Romance"]
        runtime: details.runtime,    // minutes, like 122
        overview: details.overview,  // the synopsis
    };
    res.setHeader("Cache-Control", "s-maxage=86400");   // Vercel keeps this answer for 1 day
    res.status(200).json(result);
};