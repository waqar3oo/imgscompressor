# ImgsCompressor

Canonical site for now: https://imgscompressor.vercel.app/

GitHub Pages also serves this repo at https://waqar3oo.github.io/imgscompressor/. imgscompressor.com is not connected yet. The host used in canonical links lives in site.config.js.

A tiny photo-and-signature compressor. You set a maximum size in KB; it gives you a JPEG that stays under that limit. Everything runs in your browser. Your photo never leaves your device.

## How to use

1. Open the [live site](https://imgscompressor.vercel.app/) in Chrome, Edge, Firefox, or Safari. The compressor does not upload the photo. The page itself is not an offline app, so open it while you are online.
2. Drop a photo, or click the box to choose one (JPG, PNG, WebP; HEIC only if your browser can open it).
3. Choose **Photo** or **Signature**.
4. Type a max size in KB, or tap a preset: 10 KB, 20 KB, 25 KB, 30 KB, 50 KB, 100 KB, or 200 KB.
5. Optional: set an exact width × height in pixels. For photos, leave **Fit with white background** on to letterbox (no crop or stretch). Turn it off to fill the box by centre-cropping.
6. In Signature mode you can **Clean background** (light areas become white) and convert to **Grayscale**.
7. The original photo appears under the drop area as soon as you choose it (name, size, and pixels). Nothing is compressed yet. Press **Compress** (or **Convert** in Signature mode). A progress bar runs while the file is read and while the JPEG is built.
8. Check the before/after preview and the output size, then click **Download**. Change the target or options and press the button again to make a new file.

Every JPEG is drawn again in the browser, including a file that was already under the target, so camera and location data are not copied into the download. The new file still stays under the limit you set. A PNG or WebP becomes a JPEG and can change size, but it will not finish over the target.

By default, 1 KB = 1000 bytes. That is the safer choice for government and exam portals, which sometimes count 1000 and sometimes 1024. A file under the 1000-byte definition is also under the 1024-byte definition. Uncheck the box only if a form clearly uses 1024.

## Deploy for free in about two minutes

You only need to upload `index.html` (this README is optional). This repository is already published at https://waqar3oo.github.io/imgscompressor/. The custom domain imgscompressor.com is coming soon and is not connected yet.

### GitHub Pages

1. Create a new GitHub repository (public is fine).
2. Upload `index.html` to the root of the repo. You can also rename a copy to `index.html` in a `docs` folder.
3. Open **Settings → Pages**. Under “Build and deployment”, set **Source** to **Deploy from a branch**, branch **main**, folder **/ (root)** (or `/docs` if you used that).
4. Save. After a minute, your site is at `https://YOUR_USERNAME.github.io/REPO_NAME/`.

### Netlify Drop

1. Open [https://app.netlify.com/drop](https://app.netlify.com/drop).
2. Put `index.html` in an empty folder on your computer.
3. Drag that folder onto the Netlify Drop page.
4. Netlify gives you a live public URL immediately. You can later assign a custom name in the site settings.

No build step, no account APIs, no server. The page makes no network requests of its own.

## Limitations

- Output is always a JPEG, so transparency becomes white.
- Very tight targets (for example a large 4000×3000 photo down to 10 KB) will look soft; the tool may shrink the pixel size to hit the limit and will tell you if it did.
- If you set an exact pixel size *and* a very small KB target, the file may have to come out smaller than those pixels to stay under the limit.
- HEIC/HEIF opens only when the browser itself can decode it (often Safari; often not Chrome).
- Animated images are not supported (you will get a still frame if the browser decodes one).
- Preset chips are size shortcuts (10 KB through 200 KB). If a form prints its own maximum, type that number.
- Very large images may be slow or may hit memory limits on older phones.

## Privacy

The page does not upload your file and does not call an API to compress it. It is not packaged as an offline app; open it while you are online. After the page has loaded, compression stays in the browser.
