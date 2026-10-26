# ShareCode core files

This folder contains the core ShareCode app files for generating a share code, storing file metadata, uploading and downloading files, managing saved codes, and signing in. Marketplace features are intentionally excluded.

The app uses React, Vite, and the Base44 SDK. Its backend requires a configured Base44 app, including the ShareFile entity in `base44/entities/SharedFile.jsonc` and the settings in `base44/config.jsonc`. Keep runtime credentials in Base44 configuration; do not commit secrets.

## Run locally

From this folder, install the dependencies and start the Vite development server:

```sh
npm install
npm run dev
```

The project is covered by the GPL-3.0 license in the repository root.
