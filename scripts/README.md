# Scripts

This folder contains utility scripts for the website.

## compress_images.py

Compresses images from the `images/fulls` directory and saves them to `images/compressed`.

### Usage:
```bash
python scripts/compress_images.py
```

### Requirements:
- Python 3
- PIL/Pillow library: `pip install Pillow`

### Notes:
- The script compresses images to 30% quality
- Only processes .jpg, .JPG, .jpeg, .png, .gif, and .bmp files

