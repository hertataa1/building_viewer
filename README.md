# Open House — your building, in the browser

A ready-to-publish IFC viewer. Visitors can rotate, pan, zoom, fit the building, switch to a top view, and show edges. All libraries are included; no build, API key, subscription, or library CDN is required.

## Publish on GitHub Pages

1. Unzip this package. Create a new **public** GitHub repository, named for example `building-viewer`. Use the `main` branch.
2. Upload the **contents** of the `building-viewer` folder into the repository root. Keep the `site` folder and the hidden `.github` folder. Do not upload the ZIP itself. If your upload tool hides dot-folders, use GitHub Desktop to add and publish the whole folder, or create `.github/workflows/pages.yml` in GitHub's “Add file → Create new file” and paste the included workflow.
3. In the repository choose **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Open **Actions → Publish building viewer → Run workflow**. Future changes pushed to `main` publish automatically.
5. When the workflow succeeds, find your website link in **Settings → Pages**. It normally looks like `https://YOUR-NAME.github.io/building-viewer/`.

No GitHub repository has been created or published for you.

## Add your building

1. Rename your uncompressed IFC file to `building.ifc` (lowercase is easiest).
2. Add it to **`site/models/building.ifc`** in the repository. Commit the change and wait for the publishing workflow to finish.
3. Visit your website. In “Explore a shared model”, leave `models/building.ifc` and press the arrow.
4. Once it opens, click **Copy model link**. Send that link to your friends.

You can host several models: place each in `site/models/`, then enter its matching path. Names and capital letters must match. The `site/` prefix is not part of the public path.

**Opening a file from your computer only previews it on that device. It does not upload it or make it accessible to friends.** The share button is enabled only after a published model loads. A link copied from a local preview server works only on your computer; use your GitHub Pages address for friends.

The included `models/pavilion.ifc` is an original, deliberately simple demonstration model (floor, roof, four columns), released under CC0. Enter that path to try it. It is not your building. The website starts empty unless a `?model=...` link is used. To make your building open by default, share `https://YOUR-NAME.github.io/building-viewer/?model=models/building.ifc`.

## Preview before publishing

If you have Node.js, open a terminal in this folder and run `node preview.mjs`. Visit the address it prints. Or, with Python installed, run `python -m http.server 8080 --directory site` and open `http://localhost:8080`. Stop the server with Ctrl+C. Opening `index.html` by double-clicking is not supported because browsers restrict IFC/WebAssembly loading from local file URLs.

## Practical notes

- A modern browser with WebGL and WebAssembly is required. Mouse: left-drag rotates, right-drag pans, wheel zooms. Touch: one finger rotates; two fingers pan/pinch.
- IFC parsing runs in the browser's main thread and can temporarily pause the interface. Start with smaller models. Complex files may exceed browser memory, especially on phones. There is no guaranteed maximum supported file size.
- IFC geometry and colors are shown. Unsupported geometry may be omitted. This is a preview tool, not an authoritative BIM, clash, property-inspection or measurement tool.
- Files placed in a public repository and on a public Pages site are public. Publish only models you are allowed to share. Browser-local previews are not sent to a server.
- GitHub's browser uploader and repository/Pages size limits apply. For larger models consult GitHub's current limits; do not assume Git LFS files are served as IFC by Pages.
- External URLs are intentionally not accepted. Keep models within this website. Libraries and models are served from the same origin.

## Included libraries and documentation

- That Open **web-ifc 0.0.78**, Mozilla Public License 2.0; license included in `site/vendor/web-ifc-LICENSE.md`. Browser API and single-threaded WASM are included together. [Official API](https://thatopen.github.io/engine_web-ifc/docs/classes/web-ifc.IfcAPI.html), [geometry example](https://github.com/ThatOpen/engine_web-ifc/blob/main/examples/usage/src/geometrystream.ts).
- **Three.js 0.187.0**, MIT; license included in `site/vendor/three-LICENSE.txt`. [OrbitControls](https://threejs.org/docs/#OrbitControls).
- [GitHub Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

Application source is MIT licensed; the original demonstration IFC is CC0. Third-party libraries retain their own licenses. See `VERIFICATION.md` for checks and limitations.
