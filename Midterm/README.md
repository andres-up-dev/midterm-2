# The Galaxy - Star Wars Character Catalog

An Express app serving a searchable Star Wars character catalog and character details.

## Requirements

- Node.js 18 or newer
- An internet connection when the server starts so it can load character data from the [Star Wars API dataset](https://akabab.github.io/starwars-api/)

## Run locally

From the repository root:

```sh
cd Midterm/starter
npm install
npm start
```

Open [http://localhost:3001](http://localhost:3001) in a browser. Search by character name, select a character to view its details, and use the modal controls or arrow keys to navigate between characters.

## API endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api` | Return all characters |
| `GET` | `/api?search=Luke` | Search character names (case-insensitive substring match) |
| `GET` | `/api/:id` | Return one character by numeric ID, including navigation IDs |

Successful requests return JSON. A search with no matches or a missing character ID returns `404` with a JSON `error` message.
