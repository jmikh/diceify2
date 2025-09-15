#!/usr/bin/env python3
"""
Generate PNG favicons from SVG for Google Search compatibility
"""

import os
import subprocess
import sys

# Check if required tools are installed
def check_dependencies():
    try:
        subprocess.run(['convert', '--version'], capture_output=True, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Error: ImageMagick is not installed.")
        print("Install it with: brew install imagemagick")
        sys.exit(1)

def generate_png_favicons():
    """Generate PNG favicons in required sizes from SVG"""

    svg_file = 'public/favicon.svg'
    sizes = [48, 96, 192]

    if not os.path.exists(svg_file):
        print(f"Error: {svg_file} not found")
        sys.exit(1)

    for size in sizes:
        output_file = f'public/favicon-{size}x{size}.png'
        cmd = [
            'convert',
            '-background', 'none',
            '-density', '300',
            '-resize', f'{size}x{size}',
            svg_file,
            output_file
        ]

        try:
            subprocess.run(cmd, check=True)
            print(f"✓ Generated {output_file}")
        except subprocess.CalledProcessError as e:
            print(f"✗ Failed to generate {output_file}: {e}")
            sys.exit(1)

    # Also create a standard 32x32 for legacy support
    output_file = 'public/favicon-32x32.png'
    cmd = [
        'convert',
        '-background', 'none',
        '-density', '300',
        '-resize', '32x32',
        svg_file,
        output_file
    ]

    try:
        subprocess.run(cmd, check=True)
        print(f"✓ Generated {output_file}")
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed to generate {output_file}: {e}")
        sys.exit(1)

    # Create favicon.ico with multiple sizes
    print("\nGenerating favicon.ico with multiple sizes...")
    ico_cmd = [
        'convert',
        'public/favicon-32x32.png',
        'public/favicon-48x48.png',
        'public/favicon.ico'
    ]

    try:
        subprocess.run(ico_cmd, check=True)
        print("✓ Generated public/favicon.ico")
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed to generate favicon.ico: {e}")
        sys.exit(1)

if __name__ == "__main__":
    check_dependencies()
    generate_png_favicons()
    print("\n✅ All favicons generated successfully!")
    print("\nNext steps:")
    print("1. Update layout.tsx to reference the new PNG files")
    print("2. Deploy your changes")
    print("3. Request re-indexing in Google Search Console")
    print("4. Wait 1-3 weeks for Google to update")