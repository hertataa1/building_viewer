# Verification — 31 October 2026

This is a buildless static website. The `site` directory is the complete deployment artifact, with pinned, included library files. No package install or build command is needed.

## Completed

- Downloaded web-ifc 0.0.78 and Three.js 0.187.0 from their npm registry release archives, with included licenses. Reviewed primary web-ifc API/geometry-streaming and GitHub Pages workflow documentation.
- JavaScript syntax checks passed for application and preview server.
- Served the site over local HTTP and tested in headless Google Chrome with software WebGL.
- The included original pavilion IFC was parsed by the actual browser web-ifc/WASM engine and rendered as six geometric elements. Visually inspected a desktop screenshot of the rendered model.
- Checked empty state, hosted-model loading, model query links surviving reload, local file loading, and local loading clearing the model link and disabling sharing.
- Exercised fit, top, perspective, edges, mouse rotation and wheel zoom controls. OrbitControls also supplies pan and touch gestures.
- Checked HTTP 404 feedback, rejection of invalid IFC content and external model URLs, and help dialog behavior. No JavaScript page errors were reported.
- Checked a 390-pixel mobile layout for horizontal overflow and inspected its screenshot.

## Limits

No user building file was supplied. No real project model, large model, physical touch device, Safari, Firefox, GitHub repository, or live GitHub Pages deployment was tested. Clipboard behavior can depend on browser permission; a visible link is supplied when clipboard access fails. GitHub Actions workflow follows official static Pages guidance but has not been run in a GitHub account.

The demonstration is intentionally simple and does not establish IFC schema compliance or broad geometry compatibility. Main-thread IFC parsing can pause the interface on large files. Test your own file after publishing, including from a different device using the shared link.
