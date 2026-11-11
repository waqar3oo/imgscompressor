# Free Image Compressor

Live site: https://waqar3oo.github.io/freeimagecompressor/

A tiny, private photo-and-signature compressor. You set a maximum size in KB; it gives you a JPEG that stays under that limit. Everything runs in your browser. Your photo never leaves your device.

Photo ya signature ko exact KB tak chhota karein. File aapke device se bahar nahi jati.

## How to use

1. Open the [live site](https://waqar3oo.github.io/freeimagecompressor/) or `index.html` in Chrome, Edge, Firefox, or Safari (double-click the file, or drag it into a tab). You do not need the internet after the page is open.
2. Drop a photo, or click the box to choose one (JPG, PNG, WebP; HEIC only if your browser can open it).
3. Choose **Photo** or **Signature**.
4. Type a max size in KB, or tap a preset:
   - **20 KB · Pak Navy** (photo) / **20 KB · Signature** (signature mode)
   - **25 KB · PPSC**
   - **30 KB · FPSC**
   - Also 10, 50, 100, and 200 KB
5. Optional: set an exact width × height in pixels. For photos, leave **Fit with white background** on to letterbox (no crop or stretch). Turn it off to fill the box by centre-cropping.
6. In Signature mode you can **Clean background** (light areas become white) and convert to **Grayscale**.
7. The original photo appears under the drop area as soon as you choose it (name, size, and pixels). Nothing is compressed yet. Press **Compress** (or **Convert** in Signature mode). A progress bar runs while the file is read and while the JPEG is built.
8. Check the before/after preview and the output size, then click **Download**. Change the target or options and press the button again to make a new file.

If you drop a JPEG that is already under the target, and you have not asked for a pixel resize or signature cleanup, Free Image Compressor keeps the original bytes and says so. It will not give you a larger JPEG than the one you started with, except when converting a PNG or WebP to JPEG, in which case the file may grow but still stays under the target.

By default, 1 KB = 1000 bytes. That is the safer choice for government and exam portals, which sometimes count 1000 and sometimes 1024. A file under the 1000-byte definition is also under the 1024-byte definition. Uncheck the box only if a form clearly uses 1024.

## Deploy for free in about two minutes

You only need to upload `index.html` (this README is optional). This repository is already published at https://waqar3oo.github.io/freeimagecompressor/.

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
- Preset labels such as FPSC 30 KB and PPSC 25 KB follow commonly published form limits; always read the current form instructions, which can change.
- Very large images may be slow or may hit memory limits on older phones.

## Privacy

The page does not upload your file, does not call any API, and works offline once loaded. You can confirm this by opening `index.html` from disk and disconnecting from the internet.
