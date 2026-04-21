# Snake Heads Folder

## How to Add Custom Snake Heads

1. **Add your PNG images** to this folder (`public/heads/`)
2. **Update the config file** - Edit `heads-config.json` and add your image filename to the "heads" array
3. **Restart the dev server** - The images will automatically appear as options in the game

## Example:

The config file starts empty:
```json
{
  "heads": []
}
```

After you add files like `myhead.png` and `dragon.png` to this folder, update it to:

```json
{
  "heads": [
    "myhead.png",
    "dragon.png"
  ]
}
```

## Image Requirements:

- **Format:** PNG (recommended), JPG, or SVG
- **Size:** Any size (will be auto-scaled to fit)
- **Transparent background:** Recommended for best appearance
- **Square aspect ratio:** Works best (e.g., 100x100px, 200x200px)

## Note:

The image filename (without extension) will be used as the display name in the selection menu.
