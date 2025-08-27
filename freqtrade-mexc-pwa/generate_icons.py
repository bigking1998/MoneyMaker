from PIL import Image, ImageDraw, ImageFont
import os

# Create icons directory if it doesn't exist
os.makedirs('public/icons', exist_ok=True)

# Define icon sizes
sizes = [72, 96, 128, 144, 152, 192, 384, 512]

# Create a simple icon design
for size in sizes:
    # Create a new image with the lime gradient background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw gradient background (simplified)
    for y in range(size):
        # Simple gradient from lime to darker lime
        ratio = y / size
        r = int(196 * (1 - ratio * 0.2))  # 196 = c4 in hex
        g = int(216 * (1 - ratio * 0.2))  # 216 = d8 in hex  
        b = int(45 * (1 - ratio * 0.2))   # 45 = 2d in hex
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))
    
    # Draw a rounded rectangle
    margin = size // 8
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=size // 6,
        fill=(26, 26, 26, 255)  # Dark background
    )
    
    # Draw the lightning bolt symbol
    bolt_size = size // 3
    bolt_x = size // 2 - bolt_size // 4
    bolt_y = size // 2 - bolt_size // 2
    
    # Simple lightning bolt shape
    points = [
        (bolt_x + bolt_size//4, bolt_y),
        (bolt_x, bolt_y + bolt_size//3),
        (bolt_x + bolt_size//6, bolt_y + bolt_size//3),
        (bolt_x - bolt_size//6, bolt_y + bolt_size),
        (bolt_x + bolt_size//6, bolt_y + bolt_size//1.5),
        (bolt_x, bolt_y + bolt_size//1.5),
        (bolt_x + bolt_size//4, bolt_y)
    ]
    
    draw.polygon(points, fill=(196, 216, 45, 255))  # Lime color
    
    # Save the image
    filename = f'public/icons/icon-{size}x{size}.png'
    img.save(filename, 'PNG')
    print(f'Generated {filename}')

# Create favicon.ico (16x16 and 32x32)
favicon_img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
draw = ImageDraw.Draw(favicon_img)

# Simple lime background
draw.rectangle([0, 0, 32, 32], fill=(196, 216, 45, 255))

# Dark center
draw.rectangle([4, 4, 28, 28], fill=(26, 26, 26, 255))

# Lightning bolt
points = [(12, 8), (16, 14), (14, 14), (18, 24), (14, 18), (16, 18), (12, 8)]
draw.polygon(points, fill=(196, 216, 45, 255))

favicon_img.save('public/favicon.ico', 'ICO', sizes=[(16, 16), (32, 32)])
print('Generated favicon.ico')

print('All icons generated successfully!')
