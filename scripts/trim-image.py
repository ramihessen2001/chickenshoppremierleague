#!/usr/bin/env python3
"""
Trim the blank margin from a PNG.

Logos exported from design tools often arrive on a full page canvas -- the Puro
wordmark came in at 2550x3300, a US Letter sheet at 300dpi with the mark
floating in the middle. Rendered into a small square slot with object-contain,
the artwork shrinks to nothing, because the canvas is what gets fitted, not the
mark.

This crops away the surrounding transparent or near-white pixels so the file is
the artwork and nothing else. Pair it with `sips -Z <size>` to scale the result.

Pure standard library, so it runs anywhere without installing anything.

    python3 scripts/trim-image.py input.png output.png [--pad 8] [--square]

    --pad N    keep N pixels of margin on every side (default 0)
    --square   pad the short axis so the result is square, which keeps a row of
               logos optically the same size in a grid

Handles 8-bit RGB and RGBA, non-interlaced -- what design tools export.
"""

import argparse
import struct
import sys
import zlib

PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"

# A pixel counts as background if it is transparent. For images with no alpha
# channel, near-white is treated as background instead.
ALPHA_FLOOR = 16
WHITE_CEILING = 245


def read_chunks(data):
    """Yields (type, payload) for each chunk after the signature."""
    if data[:8] != PNG_SIGNATURE:
        raise ValueError("not a PNG file")

    offset = 8
    while offset < len(data):
        (length,) = struct.unpack(">I", data[offset : offset + 4])
        chunk_type = data[offset + 4 : offset + 8]
        payload = data[offset + 8 : offset + 8 + length]
        yield chunk_type, payload
        offset += 12 + length  # length + type + payload + crc


def paeth(a, b, c):
    p = a + b - c
    pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    return b if pb <= pc else c


def unfilter(raw, width, height, channels):
    """Reverses the per-scanline filter, returning flat pixel bytes."""
    stride = width * channels
    out = bytearray(stride * height)
    previous = bytearray(stride)
    pos = 0

    for row in range(height):
        filter_type = raw[pos]
        pos += 1
        line = bytearray(raw[pos : pos + stride])
        pos += stride

        if filter_type == 1:  # Sub
            for i in range(channels, stride):
                line[i] = (line[i] + line[i - channels]) & 0xFF
        elif filter_type == 2:  # Up
            for i in range(stride):
                line[i] = (line[i] + previous[i]) & 0xFF
        elif filter_type == 3:  # Average
            for i in range(stride):
                left = line[i - channels] if i >= channels else 0
                line[i] = (line[i] + ((left + previous[i]) >> 1)) & 0xFF
        elif filter_type == 4:  # Paeth
            for i in range(stride):
                left = line[i - channels] if i >= channels else 0
                upper_left = previous[i - channels] if i >= channels else 0
                line[i] = (line[i] + paeth(left, previous[i], upper_left)) & 0xFF
        elif filter_type != 0:
            raise ValueError(f"unsupported filter type {filter_type}")

        out[row * stride : (row + 1) * stride] = line
        previous = line

    return out


def load_png(path):
    data = path.read_bytes() if hasattr(path, "read_bytes") else open(path, "rb").read()

    header = None
    idat = bytearray()

    for chunk_type, payload in read_chunks(data):
        if chunk_type == b"IHDR":
            header = struct.unpack(">IIBBBBB", payload)
        elif chunk_type == b"IDAT":
            idat += payload
        elif chunk_type == b"IEND":
            break

    if header is None:
        raise ValueError("PNG has no IHDR")

    width, height, depth, color_type, _, _, interlace = header

    if depth != 8:
        raise ValueError(f"only 8-bit images are supported (this is {depth}-bit)")
    if interlace:
        raise ValueError("interlaced PNGs are not supported")
    if color_type not in (2, 6):
        raise ValueError(
            f"only RGB and RGBA are supported (colour type {color_type}). "
            "Re-export without a palette or greyscale."
        )

    channels = 3 if color_type == 2 else 4
    pixels = unfilter(zlib.decompress(bytes(idat)), width, height, channels)
    return width, height, channels, pixels


def content_bounds(width, height, channels, pixels):
    """The tightest box containing artwork, or None if the image is blank."""
    stride = width * channels
    left, right, top, bottom = width, -1, height, -1

    for y in range(height):
        row = y * stride
        for x in range(width):
            i = row + x * channels

            if channels == 4:
                # With an alpha channel, transparency alone defines the
                # background. Testing colour as well would erase white artwork
                # on a transparent canvas -- which is exactly what the white
                # Puro wordmark is.
                if pixels[i + 3] < ALPHA_FLOOR:
                    continue
            elif (
                pixels[i] > WHITE_CEILING
                and pixels[i + 1] > WHITE_CEILING
                and pixels[i + 2] > WHITE_CEILING
            ):
                continue

            if x < left:
                left = x
            if x > right:
                right = x
            if y < top:
                top = y
            if y > bottom:
                bottom = y

    return None if right < 0 else (left, top, right, bottom)


def write_png(path, width, height, channels, pixels):
    color_type = 2 if channels == 3 else 6
    stride = width * channels

    raw = bytearray()
    for y in range(height):
        raw.append(0)  # filter: None
        raw += pixels[y * stride : (y + 1) * stride]

    def chunk(kind, payload):
        return (
            struct.pack(">I", len(payload))
            + kind
            + payload
            + struct.pack(">I", zlib.crc32(kind + payload) & 0xFFFFFFFF)
        )

    with open(path, "wb") as handle:
        handle.write(PNG_SIGNATURE)
        handle.write(
            chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, color_type, 0, 0, 0))
        )
        handle.write(chunk(b"IDAT", zlib.compress(bytes(raw), 9)))
        handle.write(chunk(b"IEND", b""))


def main():
    parser = argparse.ArgumentParser(description="Trim blank margins from a PNG.")
    parser.add_argument("source")
    parser.add_argument("destination")
    parser.add_argument("--pad", type=int, default=0, help="margin to keep, in pixels")
    parser.add_argument(
        "--square", action="store_true", help="pad the short axis to make it square"
    )
    args = parser.parse_args()

    width, height, channels, pixels = load_png(args.source)
    bounds = content_bounds(width, height, channels, pixels)

    if bounds is None:
        sys.exit("That image looks entirely blank; nothing to trim.")

    left, top, right, bottom = bounds
    crop_width = right - left + 1
    crop_height = bottom - top + 1

    pad_x = pad_y = args.pad
    if args.square:
        # Grow the short axis so the artwork sits centred in a square.
        if crop_width > crop_height:
            pad_y += (crop_width - crop_height) // 2
        else:
            pad_x += (crop_height - crop_width) // 2

    out_width = crop_width + pad_x * 2
    out_height = crop_height + pad_y * 2

    # Padding is transparent when we have an alpha channel, white otherwise.
    blank = bytes([255] * channels) if channels == 3 else bytes([255, 255, 255, 0])
    out = bytearray(blank * (out_width * out_height))

    src_stride = width * channels
    dst_stride = out_width * channels

    for y in range(crop_height):
        src = (top + y) * src_stride + left * channels
        dst = (y + pad_y) * dst_stride + pad_x * channels
        out[dst : dst + crop_width * channels] = pixels[
            src : src + crop_width * channels
        ]

    write_png(args.destination, out_width, out_height, channels, out)

    print(f"{args.source}: {width}x{height}  ->  {out_width}x{out_height}")
    print(f"  artwork occupied {crop_width}x{crop_height} of the original canvas")


if __name__ == "__main__":
    main()
