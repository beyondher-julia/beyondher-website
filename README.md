# Beyond Her website

Edit the website with the Pages CMS editor (pagescms.org), or edit the files in the `content` folder on GitHub.

- `content/` holds all the words and links (home.json, letters.json, site.json)
- `public/images/` holds the photos
- `templates/` holds the page designs (you shouldn't need to change these)
- `.pages.yml` sets up the fill-in boxes in the editor
- `build.js` builds the pages. Cloudflare runs `node build.js` automatically when you save a change.
