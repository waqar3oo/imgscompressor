#!/usr/bin/env python3
"""Build the homepage, keyword pages, sitemap, and the noindex /preview/seo/ copy.

Host URLs come only from site.config.js.
"""
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG = (ROOT / "site.config.js").read_text()
ORIGIN = re.search(r'origin:\s*"([^"]+)"', CONFIG).group(1).rstrip("/")

LINKS = [
    ("Home", ""),
    ("20 KB", "compress-image-to-20kb/"),
    ("50 KB", "compress-image-to-50kb/"),
    ("100 KB", "compress-image-to-100kb/"),
    ("FPSC photo", "fpsc-photo-size/"),
    ("PPSC photo", "ppsc-photo-size/"),
    ("Signature", "signature-resize/"),
]


def words(html):
    text = re.sub(r"<[^>]+>", " ", html)
    return len(text.split())


def footer(depth):
    parts = []
    for label, href in LINKS:
        if href:
            url = ("../" * depth) + href
        else:
            url = "./" if depth == 0 else "../" * depth
        parts.append(f'<a href="{url}">{label}</a>')
    return (
        '<footer class="site-foot"><nav aria-label="Guides">\n  '
        + "\n  ".join(parts)
        + "\n</nav></footer>"
    )


def main_block(h1, lead, body, faqs):
    faq = "\n".join(
        f"    <details><summary>{q}</summary><p>{a}</p></details>" for q, a in faqs
    )
    return (
        '<main class="seo" id="guide">\n'
        f"  <h1>{h1}</h1>\n"
        f'  <p class="lead">{lead}</p>\n'
        f"{body}\n"
        "  <h2>Questions</h2>\n"
        '  <div class="faq">\n'
        f"{faq}\n"
        "  </div>\n"
        "</main>\n"
    )


def ld_json(url, description, faqs):
    web = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "ImgsCompressor",
        "url": url,
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "Any",
        "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
        "description": description,
    }
    faq = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": q,
                "acceptedAnswer": {"@type": "Answer", "text": a},
            }
            for q, a in faqs
        ],
    }
    return (
        '<script type="application/ld+json">\n'
        + json.dumps(web, ensure_ascii=False)
        + '\n</script>\n<script type="application/ld+json">\n'
        + json.dumps(faq, ensure_ascii=False)
        + "\n</script>"
    )


HOME_FAQS = [
    (
        "Does the photo leave this device?",
        "No. The browser compresses it locally. The page does not upload the picture or send it to an account.",
    ),
    (
        "What does the KB limit mean?",
        "The JPEG is at or under the number you set. One KB is 1,000 bytes unless you switch the option to 1,024.",
    ),
    (
        "Why is a small original still rewritten?",
        "Saving through the canvas drops camera and location data that can sit inside the file you started with. The new JPEG still stays under the limit.",
    ),
    (
        "Can I compress more than one picture?",
        "Yes. Batch uses the same mode and limit for up to 20 files, then packs the finished JPEGs into a ZIP.",
    ),
    (
        "What if one file cannot hit the limit?",
        "That row is marked as not reaching the target, and it is left out of the ZIP. The others still download.",
    ),
    (
        "Will the presets match every government form?",
        "No. The size table is a starting point from documents we could check. Read the advertisement you are applying under.",
    ),
    (
        "Does the site work with no connection?",
        "There is no offline app mode. Open the page while you are online. Compression itself does not contact a server.",
    ),
]

HOME_BODY = """
  <h2>How it works</h2>
  <ol>
    <li>Add one picture, or switch to Batch and add up to 20.</li>
    <li>Choose Photo or Signature, then type a maximum or tap a preset.</li>
    <li>Press Compress. Download the JPEG, or a ZIP of every finished file.</li>
  </ol>
  <h2>Pakistan form sizes</h2>
  <p>Use these only as a reading of the sources linked here. If a cell says to check the latest advert, the form in front of you wins.</p>
  <div class="table-wrap">
    <table class="size-table">
      <thead><tr><th>Form</th><th>What we could verify</th><th>Source</th></tr></thead>
      <tbody>
        <tr>
          <td>FPSC photograph</td>
          <td>The Section Officers Promotional Examination guideline says the passport photo must be JPEG and less than 30 KB. Later advertisements can differ.</td>
          <td><a href="https://online.fpsc.gov.pk/fpsc/sope/SOPE2016_GuidelinesforApplyingOnline_01-12-2016.pdf">FPSC SOPE online guideline (PDF)</a></td>
        </tr>
        <tr>
          <td>PPSC photograph and CNIC</td>
          <td>The jobs page links a photograph and CNIC guide. Copies of the online application procedure say each image should be under 25 KB, while a later photograph note is described at 60 KB. Check the latest advert.</td>
          <td><a href="https://www.ppsc.gop.pk/Jobs.aspx">PPSC jobs</a></td>
        </tr>
        <tr>
          <td>Pakistan Navy registration photo</td>
          <td>Register on the official site. A single KB figure was not confirmed from that site for this table. Check the latest advert.</td>
          <td><a href="https://joinpaknavy.gov.pk/">Join Pak Navy</a></td>
        </tr>
        <tr>
          <td>Signature</td>
          <td>Forms often want a scan on white paper in dark ink. The KB limit is not the same on every advert. Check the latest advert.</td>
          <td>See the signature page and the form you are filing.</td>
        </tr>
      </tbody>
    </table>
  </div>
""".strip("\n")

PAGES = [
    {
        "slug": "",
        "title": "Compress Image to Exact KB, Free and Private | ImgsCompressor",
        "description": "Compress a photo or signature to an exact KB in your browser. No sign-up and no watermark. The file stays on this device.",
        "h1": "Compress Image to Exact KB, Free and Private",
        "lead": "Set a maximum in kilobytes and download a JPEG that stays under it. Processing happens in the browser, and the picture is not uploaded.",
        "body": HOME_BODY,
        "faqs": HOME_FAQS,
        "mode": "photo",
        "preset": None,
    },
    {
        "slug": "compress-image-to-20kb",
        "title": "Compress Image to 20 KB | ImgsCompressor",
        "description": "Make a JPEG of 20 KB or less in the browser. Photo mode is ready at 20 KB, with the long side reduced before quality is chosen.",
        "h1": "Compress an Image to 20 KB",
        "lead": "This page opens Photo mode with 20 KB already filled in.",
        "body": """
  <h2>When 20 KB is the ceiling</h2>
  <p>Some upload boxes refuse a photograph the moment it passes a small limit, even by a fraction of a kilobyte. Twenty is that kind of ceiling. The compressor on this page is aimed at it from the start, so you do not have to type the number.</p>
  <p>A large camera file is shortened on its longest side to about 1,200 pixels before the quality search begins. That order keeps a face more readable than crushing a 4,000 pixel frame with quality alone. A picture that is already smaller is left at its own size. Nothing is stretched upward.</p>
  <p>The result line prints the real size, for example 19.4 KB of 20 KB. The downloaded name uses that same figure, such as portrait-19.4kb.jpg. Batch works here too: compress the first set, add more, then compress only the new files and download a ZIP.</p>
  <p>Change the number if the form you are filing asks for something else. A Navy registration page should be read on <a href="https://joinpaknavy.gov.pk/">joinpaknavy.gov.pk</a> before you treat 20 KB as the current rule. Stricter exam photos are covered on the <a href="../fpsc-photo-size/">FPSC</a> and <a href="../ppsc-photo-size/">PPSC</a> pages.</p>
""".strip("\n"),
        "faqs": [
            ("Is the file allowed to be exactly 20 KB?", "Yes. The check is at or under the target, using 1,000 bytes per KB unless you switch to 1,024."),
            ("Will a photo that is already 15 KB be copied unchanged?", "No. It is drawn again as a JPEG so camera metadata is not kept, and the new file still has to stay under 20 KB."),
            ("Why does a huge photo look soft at 20 KB?", "There are not many bytes left for detail. The long side is capped first so the softness is spread more evenly."),
        ],
        "mode": "photo",
        "preset": "20",
    },
    {
        "slug": "compress-image-to-50kb",
        "title": "Compress Image to 50 KB | ImgsCompressor",
        "description": "Compress a photo to 50 KB or less. The page starts at 50 KB and keeps the JPEG at or under that ceiling.",
        "h1": "Compress an Image to 50 KB",
        "lead": "Photo mode is selected and the maximum is 50 KB.",
        "body": """
  <h2>A middle size for forms and email</h2>
  <p>Fifty kilobytes is enough for a clearer portrait than a 20 KB cap, and it is still small enough for many portals and mail forms. This page starts there so the first press of Compress is already aimed at that ceiling.</p>
  <p>If the longest side is over 1,200 pixels, it is reduced to 1,200 before quality is searched. The search then keeps the largest JPEG that does not cross 50 KB. You can still type another number if the instructions are tighter or looser.</p>
  <p>The name on the download matches the size printed in the panel, rounded the same way. A batch of mixed JPG, PNG, and WebP files shares this limit. Pictures you add while a run is going stay marked Waiting until you compress the new ones.</p>
  <p>Do not use 50 KB when the advert says 20, 25, or 30. Those pages are separate: <a href="../compress-image-to-20kb/">20 KB</a>, <a href="../ppsc-photo-size/">PPSC</a>, and <a href="../fpsc-photo-size/">FPSC</a>. An original that is already under 50 KB is still re-encoded, so the download is not a byte-for-byte copy of the file you dropped in.</p>
""".strip("\n"),
        "faqs": [
            ("Does 50 KB mean the file will be exactly 50.0 KB?", "It will be as close as the encoder can get without going over. The panel shows the real size."),
            ("Can I compare before and after?", "Yes. After a single compress, drag the slider. The original stays on one side and the JPEG on the other."),
            ("What unit should I leave on?", "Leave 1 KB = 1,000 bytes unless the form explicitly says 1,024. A file under the 1,000-byte count is also under the 1,024-byte count."),
        ],
        "mode": "photo",
        "preset": "50",
    },
    {
        "slug": "compress-image-to-100kb",
        "title": "Compress Image to 100 KB | ImgsCompressor",
        "description": "Reduce a photo to 100 KB or less while keeping more detail. Photo mode opens with 100 KB selected.",
        "h1": "Compress an Image to 100 KB",
        "lead": "The maximum is set to 100 KB in Photo mode.",
        "body": """
  <h2>More room for texture</h2>
  <p>A 100 KB ceiling suits a portrait or a scan when the form allows it and you want hair, cloth, or printed text to stay easier to read. It is the roomier preset, not a substitute for a tighter exam rule.</p>
  <p>Originals longer than 1,600 pixels on the long side are brought to 1,600 first. Smaller originals are not enlarged. Quality is then chosen so the JPEG stops at or under 100 KB. The exact-size fields under More options still let you set a width and height when a form prints pixels as well as kilobytes.</p>
  <p>When the run ends, the button reads Compress again or Compress all. It should not stay on Compressing after the queue is done. The percentage beside the bar is dark blue on the white panel so it remains readable.</p>
  <p>Switch away from this page for a signature or a small exam photo. <a href="../signature-resize/">Signature resize</a> starts in Signature mode, and <a href="../compress-image-to-20kb/">20 KB</a> is the strict portrait preset.</p>
""".strip("\n"),
        "faqs": [
            ("Will 100 KB upscale a small scan?", "No. The long-side cap only shrinks pictures that are already larger than 1,600 pixels."),
            ("Can I compress a PNG to a 100 KB JPEG?", "Yes. Output is always JPEG, so transparency becomes white. The file still has to land at or under 100 KB."),
            ("Does the ZIP include a failed row?", "No. Only rows that finished under the limit are packed."),
        ],
        "mode": "photo",
        "preset": "100",
    },
    {
        "slug": "fpsc-photo-size",
        "title": "FPSC Photo Size | Compress to 30 KB | ImgsCompressor",
        "description": "Prepare an FPSC-style passport JPEG under 30 KB. The 30 KB preset is selected. Confirm the current advertisement before you upload.",
        "h1": "FPSC Photo Size for the Online Form",
        "lead": "Photo mode opens at 30 KB, the figure in the FPSC Section Officers guideline.",
        "body": """
  <h2>The 30 KB photograph line</h2>
  <p>The Federal Public Service Commission guideline for the Section Officers Promotional Examination tells applicants to upload a passport-size photograph with the Browse button, and it says the picture must be less than 30 KB in JPEG only. That PDF is on the FPSC site: <a href="https://online.fpsc.gov.pk/fpsc/sope/SOPE2016_GuidelinesforApplyingOnline_01-12-2016.pdf">SOPE online guideline</a>. This page selects 30 KB so you can make a file in that range.</p>
  <p>The document is from that examination’s instructions, not a promise about every later consolidated post. Read the advertisement you are using, and the current online guideline, before you submit. This tool does not file the application, pay the fee, or check your eligibility.</p>
  <p>Drop the photo and press Compress. The JPEG is built on this device, metadata from the camera file is not copied across, and the name matches the size you see, such as photo-28.6kb.jpg. If you also need a signature, the advert usually prints that limit separately. Open <a href="../signature-resize/">signature resize</a> and set the number it shows.</p>
  <p>A CNIC scan and a fee challan are different uploads. Do not assume they share the 30 KB photo rule.</p>
""".strip("\n"),
        "faqs": [
            ("Is 30 KB the limit on every FPSC post today?", "The cited guideline says less than 30 KB for that photograph step. Check the latest advert, because a later post can change it."),
            ("Does the tool crop to passport shape?", "Only if you enter both width and height under More options. Otherwise it keeps the photo’s own shape and controls the file size."),
            ("Where is the PPSC figure?", "PPSC is a different commission. Its working target on this site is 25 KB, on the PPSC photo page."),
        ],
        "mode": "photo",
        "preset": "30",
    },
    {
        "slug": "ppsc-photo-size",
        "title": "PPSC Photo Size | Compress to 25 KB | ImgsCompressor",
        "description": "Prepare a PPSC photograph under 25 KB. Photo mode starts at 25 KB. Read the current PPSC guide before you submit.",
        "h1": "PPSC Photo Size for the Online Application",
        "lead": "Photo mode opens at 25 KB, the stricter figure quoted from PPSC application steps.",
        "body": """
  <h2>Two numbers, one safer file</h2>
  <p>The Punjab Public Service Commission jobs page tells applicants to read the photograph and CNIC picture requirements before they apply: <a href="https://www.ppsc.gop.pk/Jobs.aspx">ppsc.gop.pk/Jobs.aspx</a>. Copies of the commission’s online application procedure say the latest photograph and the CNIC front image should each be under 25 KB. A later photograph note has been described, by people comparing the two documents, as allowing up to 60 KB.</p>
  <p>This page does not treat those as one rule. It preselects 25 KB because a file under that stricter line also fits a 60 KB box. If the advertisement open in front of you prints another number, replace 25 before you compress.</p>
  <p>Use Photo mode for the portrait. The browser redraws it as a JPEG, drops camera metadata, and keeps the result at or under the box. Zoom in on a CNIC image after compressing: identity-card text is small, and if it turns muddy you should follow the higher limit when the portal actually accepts it.</p>
  <p>Background, centimetre size, and what you may wear are in the commission’s own photograph guide, not invented here. The <a href="../fpsc-photo-size/">FPSC page</a> is a different 30 KB photograph rule.</p>
""".strip("\n"),
        "faqs": [
            ("Why not start at 60 KB?", "Copies of the upload steps say under 25 KB. Starting there avoids a file that passes one note and fails the other."),
            ("Is the CNIC the same preset?", "Prepare it under the same KB ceiling only if the guide you are reading groups it with the photograph. Check that the numbers stay legible."),
            ("Can I do the photo and a signature together?", "Add both in Batch only when they share a limit. Otherwise compress them on separate passes with the number each one requires."),
        ],
        "mode": "photo",
        "preset": "25",
    },
    {
        "slug": "signature-resize",
        "title": "Resize a Signature for an Online Form | ImgsCompressor",
        "description": "Turn a signature scan into a small JPEG. Signature mode opens at 20 KB, with a clean background and dark ink. Change the KB if the form prints one.",
        "h1": "Resize a Signature Scan to a Small JPEG",
        "lead": "Signature mode is on, with 20 KB selected as a starting point when the form does not print a size.",
        "body": """
  <h2>A scan, not a portrait</h2>
  <p>Sign on plain white paper with black or blue ink. Photograph it straight down, or scan it, and keep the frame tight so the desk does not fill the file. This page starts in Signature mode. Clean background and grayscale are both on: pale paper is pushed toward white, and the ink stays dark.</p>
  <p>Twenty kilobytes is a practical start, not a universal rule. If the advert prints 10 KB, 30 KB, or a range, type that number. The JPEG will stop at or under whatever you set, and the file name will use the real size shown on the screen.</p>
  <p>You can turn the two signature options off under the mode switch if the form wants the scan left untouched apart from size. Exact width and height, when a form states them, sit under More options. Leaving both blank keeps the crop you already made.</p>
  <p>Photograph limits are separate. <a href="../fpsc-photo-size/">FPSC</a> and <a href="../ppsc-photo-size/">PPSC</a> each have their own photo page, and a signature line on those forms is often a different number from the portrait.</p>
""".strip("\n"),
        "faqs": [
            ("Should I upload the original camera photo?", "No. Use the JPEG this page downloads. The original is often far larger than a form accepts, and it can carry location data."),
            ("What if 20 KB makes the ink break up?", "Raise the maximum to the number printed on the form. A slightly larger ceiling keeps the stroke clearer."),
            ("Does grayscale remove a blue pen?", "It turns the colour into dark gray tones. The stroke should remain. If it fades, turn grayscale off and compress again."),
        ],
        "mode": "signature",
        "preset": "20",
    },
]


def esc_attr(value):
    return (
        value.replace("&", "&amp;")
        .replace('"', "&quot;")
        .replace("<", "&lt;")
    )


def extract_assets(html):
    css_path = ROOT / "assets" / "app.css"
    js_path = ROOT / "assets" / "app.js"
    style = re.search(r"<style>\n(.*)\n  </style>", html, re.S)
    script = re.search(r"<script>\n(  \(function \(\) \{.*?\n  \}\)\(\);)\n  </script>", html, re.S)
    if style and script:
        css_path.write_text(style.group(1).strip() + "\n")
        js_path.write_text(script.group(1).strip() + "\n")
        html = html.replace(style.group(0), '<link rel="stylesheet" href="assets/app.css">')
        html = html.replace(script.group(0), '<script src="assets/app.js"></script>')
    elif not css_path.exists() or not js_path.exists():
        raise SystemExit("index.html has no inline app and assets/app.css is missing")
    return html


def set_head(html, page, canonical, noindex):
    title = esc_attr(page["title"])
    desc = esc_attr(page["description"])
    html = re.sub(r"<title>.*?</title>", f"<title>{title}</title>", html, count=1)
    html = re.sub(
        r'<meta name="description" content="[^"]*">',
        f'<meta name="description" content="{desc}">',
        html,
        count=1,
    )
    html = re.sub(
        r'<link rel="canonical" href="[^"]*">',
        f'<link rel="canonical" href="{canonical}">',
        html,
        count=1,
    )
    html = re.sub(
        r'<meta property="og:title" content="[^"]*">',
        f'<meta property="og:title" content="{title}">',
        html,
        count=1,
    )
    html = re.sub(
        r'<meta property="og:description" content="[^"]*">',
        f'<meta property="og:description" content="{desc}">',
        html,
        count=1,
    )
    html = re.sub(
        r'<meta property="og:url" content="[^"]*">',
        f'<meta property="og:url" content="{canonical}">',
        html,
        count=1,
    )
    html = re.sub(
        r'<meta property="og:image" content="[^"]*">',
        f'<meta property="og:image" content="{ORIGIN}/og-image.png">',
        html,
        count=1,
    )
    html = re.sub(
        r'<meta name="twitter:title" content="[^"]*">',
        f'<meta name="twitter:title" content="{title}">',
        html,
        count=1,
    )
    html = re.sub(
        r'<meta name="twitter:description" content="[^"]*">',
        f'<meta name="twitter:description" content="{desc}">',
        html,
        count=1,
    )
    html = re.sub(
        r'<meta name="twitter:url" content="[^"]*">',
        f'<meta name="twitter:url" content="{canonical}">',
        html,
        count=1,
    )
    html = re.sub(
        r'<meta name="twitter:image" content="[^"]*">',
        f'<meta name="twitter:image" content="{ORIGIN}/og-image.png">',
        html,
        count=1,
    )
    html = re.sub(r'\n  <meta name="robots" content="noindex">', "", html)
    if noindex:
        html = html.replace(
            '<meta charset="utf-8">',
            '<meta charset="utf-8">\n  <meta name="robots" content="noindex">',
            1,
        )
    block = ld_json(canonical, page["description"], page["faqs"])
    html = re.sub(
        r'\n\s*<script type="application/ld\+json">.*?</script>\s*<script type="application/ld\+json">.*?</script>',
        "",
        html,
        count=1,
        flags=re.S,
    )
    html = html.replace(
        '<meta name="twitter:image" content="' + ORIGIN + '/og-image.png">',
        '<meta name="twitter:image" content="' + ORIGIN + '/og-image.png">\n  ' + block,
        1,
    )
    return html


def retarget(html, depth):
    prefix = "../" * depth
    if depth:
        html = html.replace('href="assets/', f'href="{prefix}assets/')
        html = html.replace('href="site.webmanifest"', f'href="{prefix}site.webmanifest"')
        html = html.replace('src="assets/app.js"', f'src="{prefix}assets/app.js"')
        html = html.replace('<a class="brand" href="./"', '<a class="brand" href="' + prefix + '"', 1)
    return html


def apply_page(html, page, depth):
    mode = page["mode"]
    preset = page["preset"]
    attrs = f'data-mode="{mode}"'
    if preset:
        attrs += f' data-preset="{preset}"'
    html = re.sub(r"<body[^>]*>", f"<body {attrs}>", html, count=1)
    block = "<!-- page-copy:start -->\n" + main_block(page["h1"], page["lead"], page["body"], page["faqs"]) + footer(depth) + "\n<!-- page-copy:end -->"
    if "<!-- page-copy:start -->" in html:
        html = re.sub(r"<!-- page-copy:start -->.*?<!-- page-copy:end -->", block, html, count=1, flags=re.S)
    else:
        html = html.replace(
            '  <input id="file"',
            "  " + block + '\n  <input id="file"',
            1,
        )
    return html


def public_url(slug, preview):
    path = "/preview/seo/" if preview else "/"
    if slug:
        path += slug + "/"
    return ORIGIN + path


def write_tree(base_html, preview):
    out_root = ROOT / "preview" / "seo" if preview else ROOT
    for page in PAGES:
        depth = 0 if not page["slug"] else 1
        html = retarget(base_html, depth)
        html = apply_page(html, page, depth)
        html = set_head(html, page, public_url(page["slug"], preview), preview)
        dest = out_root / page["slug"] / "index.html" if page["slug"] else out_root / "index.html"
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(html)
        if page["slug"]:
            count = words(page["body"])
            if not 150 <= count <= 300:
                raise SystemExit(f"{page['slug']} guide is {count} words")
    if preview:
        assets = out_root / "assets"
        if assets.exists():
            shutil.rmtree(assets)
        shutil.copytree(ROOT / "assets", assets)
        shutil.copy(ROOT / "site.webmanifest", out_root / "site.webmanifest")


def write_robots_and_sitemap():
    urls = [public_url(p["slug"], False) for p in PAGES]
    body = ["User-agent: *", "Allow: /", "Disallow: /preview/", "", "Sitemap: " + ORIGIN + "/sitemap.xml", ""]
    (ROOT / "robots.txt").write_text("\n".join(body))
    locs = "\n".join(f"  <url><loc>{u}</loc></url>" for u in urls)
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + locs
        + "\n</urlset>\n"
    )


def main():
    html = (ROOT / "index.html").read_text()
    html = extract_assets(html)
    # Homepage shell is depth 0 and is the base other pages clone before retarget.
    home = next(p for p in PAGES if p["slug"] == "")
    html = apply_page(html, home, 0)
    html = set_head(html, home, public_url("", False), False)
    (ROOT / "index.html").write_text(html)
    write_tree(html, preview=False)
    write_tree((ROOT / "index.html").read_text(), preview=True)
    write_robots_and_sitemap()
    batch = ROOT / "preview" / "batch"
    if batch.exists():
        shutil.rmtree(batch)
    print("origin", ORIGIN)
    print("pages", len(PAGES), "preview ready")


if __name__ == "__main__":
    main()
