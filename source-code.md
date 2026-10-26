# ShareCode source snippets

These snippets are copied from the **View Source Code** panel on [sharecode.base44.app](https://sharecode.base44.app/). That panel exposes selected examples, not the complete Base44 project export.

## Code generation

```js
function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}
```

## Entity schema

```js
{
  code, file_url, file_name, file_size, file_type,
  source_type: "direct|gdrive|onedrive|dropbox",
  uses_type: "single|multi|unlimited",
  uses_remaining, total_downloads, is_active,
  virus_check_status, integrity_status, check_notes
}
```

## Download flow

```js
const [file] = await SharedFile.filter({ code, is_active: true });
if (file.uses_remaining <= 0) return "expired";
await SharedFile.update(file.id, {
  uses_remaining: file.uses_remaining - 1,
  total_downloads: file.total_downloads + 1,
});
window.open(file.file_url || file.external_url, "_blank");
```

## Full app code

The public panel does not include all app files. Base44's **GitHub connection** is available only on the Builder plan or above, and the project currently shows it as locked. Once enabled, connect the Sharecode project to this repository to sync the full source.

These excerpts are published under the repository's GPL-3.0 license. Review and test them in the full app before using them as standalone code.
