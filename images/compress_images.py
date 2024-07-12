import os
from PIL import Image

# Define source and destination directories
source_dir = 'c:/Users/Jeff/Desktop/Python/Website/ace-etn1.github.io/images/fulls'
destination_dir = 'c:/Users/Jeff/Desktop/Python/Website/ace-etn1.github.io/images/compressed'

# Ensure destination directory exists
os.makedirs(destination_dir, exist_ok=True)

# Loop through all files in the source directory
for filename in os.listdir(source_dir):
    # Check if the file is an image
    if filename.endswith(('.jpg','.JPG','.jpeg', '.png', '.gif', '.bmp')):
        # Open an image file
        with Image.open(os.path.join(source_dir, filename)) as img:
            # Define the save path for the compressed image
            save_path = os.path.join(destination_dir, filename)
            # Save the image with compression (quality can be adjusted as needed)
            img.save(save_path, optimize=True, quality=30)

print("Images have been copied and compressed.")
