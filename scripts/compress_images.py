import os
from PIL import Image, ImageOps

# Define source and destination directories (relative to script location)
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)
source_dir = os.path.join(project_root, 'images', 'fulls')
destination_dir = os.path.join(project_root, 'images', 'compressed')

os.makedirs(destination_dir, exist_ok=True)

created = 0
for filename in os.listdir(source_dir):
    if filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.bmp')):
        with Image.open(os.path.join(source_dir, filename)) as img:
            img = ImageOps.exif_transpose(img).convert('RGB')
            img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
            stem = os.path.splitext(filename)[0]
            save_path = os.path.join(destination_dir, f'{stem}.webp')
            img.save(save_path, 'WEBP', quality=78, method=6)
            created += 1

print(f'Built {created} gallery thumbnails.')
