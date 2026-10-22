#!/usr/bin/env python3
"""Frontend Remix font helper (Firefox native messaging host).

Firefox doesn't let extensions list the fonts installed on the computer, so the
extension asks this small helper instead. It reads the family name out of every
font file in the usual macOS font folders (system, /Library, your user folder,
fonts downloaded through Font Book, and Adobe Fonts) and sends the list back.

Messages (JSON):
  {"cmd": "list"}  -> fast scan of font files             -> {"ok": true, "fonts": [...]}
  {"cmd": "deep"}  -> file scan + everything macOS reports
                      via system_profiler (catches fonts
                      activated by font managers; slower)  -> {"ok": true, "fonts": [...]}
"""
import json
import os
import struct
import subprocess
import sys

HOME = os.path.expanduser("~")
FONT_DIRS = [
    "/System/Library/Fonts",
    "/Library/Fonts",
    "/Network/Library/Fonts",
    os.path.join(HOME, "Library/Fonts"),
    # fonts downloaded on demand through Font Book
    "/System/Library/AssetsV2",
    "/System/Library/Assets",
    # Adobe Fonts (Creative Cloud) activated fonts
    os.path.join(HOME, "Library/Application Support/Adobe/CoreSync/plugins/livetype"),
    # fonts bundled for Microsoft Office apps
    "/Applications/Microsoft Word.app/Contents/Resources/DFonts",
]
FONT_EXT = (".ttf", ".otf", ".ttc", ".otc", ".dfont")
HIDDEN = {"LastResort"}


# ---------- native messaging framing ----------
def read_message():
    raw = sys.stdin.buffer.read(4)
    if len(raw) < 4:
        return None
    (n,) = struct.unpack("=I", raw)
    return json.loads(sys.stdin.buffer.read(n).decode("utf-8"))


def send_message(obj):
    data = json.dumps(obj).encode("utf-8")
    sys.stdout.buffer.write(struct.pack("=I", len(data)))
    sys.stdout.buffer.write(data)
    sys.stdout.buffer.flush()


# ---------- font file parsing (no dependencies) ----------
def _decode(platform, encoding, raw):
    if platform == 0 or (platform == 3 and encoding in (0, 1, 10)):
        return raw.decode("utf-16-be", "ignore")
    if platform == 1 and encoding == 0:
        return raw.decode("mac_roman", "ignore")
    return None


def family_from_sfnt(buf, off):
    """Return the family name of the sfnt font starting at byte `off` of buf."""
    if off + 12 > len(buf):
        return None
    num_tables = struct.unpack_from(">H", buf, off + 4)[0]
    name_off = None
    for i in range(num_tables):
        rec = off + 12 + i * 16
        if rec + 16 > len(buf):
            return None
        tag, _, t_off, _ = struct.unpack_from(">4sIII", buf, rec)
        if tag == b"name":
            name_off = t_off
            break
    if name_off is None or name_off + 6 > len(buf):
        return None
    _, count, str_off = struct.unpack_from(">HHH", buf, name_off)
    # best[nameID] = (score, text); prefer Windows English, then Mac English, then anything
    best = {}
    for i in range(count):
        rec = name_off + 6 + i * 12
        if rec + 12 > len(buf):
            break
        plat, enc, lang, nid, length, s_off = struct.unpack_from(">HHHHHH", buf, rec)
        if nid not in (1, 16):
            continue
        start = name_off + str_off + s_off
        text = _decode(plat, enc, buf[start:start + length])
        if not text:
            continue
        text = text.strip().strip("\x00")
        if not text:
            continue
        if plat == 3 and lang == 0x409:
            score = 3
        elif plat == 1 and lang == 0:
            score = 2
        else:
            score = 1
        if nid not in best or score > best[nid][0]:
            best[nid] = (score, text)
    # typographic family (16) is what macOS / CSS uses; fall back to legacy family (1)
    for nid in (16, 1):
        if nid in best:
            return best[nid][1]
    return None


def families_from_dfont(buf):
    """Mac resource-fork font suitcase (.dfont): pull the 'sfnt' resources."""
    out = []
    if len(buf) < 16:
        return out
    data_off, map_off = struct.unpack_from(">II", buf, 0)
    if map_off + 30 > len(buf):
        return out
    type_list = map_off + struct.unpack_from(">H", buf, map_off + 24)[0]
    n_types = struct.unpack_from(">H", buf, type_list)[0] + 1
    for t in range(n_types):
        rtype, n_minus1, ref_off = struct.unpack_from(">4sHH", buf, type_list + 2 + t * 8)
        if rtype != b"sfnt":
            continue
        for r in range(n_minus1 + 1):
            ref = type_list + ref_off + r * 12
            attr_off = struct.unpack_from(">I", buf, ref + 4)[0] & 0xFFFFFF
            start = data_off + attr_off + 4  # skip 4-byte resource length
            fam = family_from_sfnt(buf, start)
            if fam:
                out.append(fam)
    return out


def families_from_file(path):
    try:
        with open(path, "rb") as f:
            buf = f.read()
    except OSError:
        return []
    try:
        if path.lower().endswith(".dfont"):
            return families_from_dfont(buf)
        if buf[:4] == b"ttcf":
            n = struct.unpack_from(">I", buf, 8)[0]
            offs = struct.unpack_from(">%dI" % n, buf, 12)
            return [f for f in (family_from_sfnt(buf, o) for o in offs) if f]
        fam = family_from_sfnt(buf, 0)
        return [fam] if fam else []
    except (struct.error, ValueError):
        return []


def scan_files():
    names = set()
    for root in FONT_DIRS:
        if not os.path.isdir(root):
            continue
        for dirpath, _, files in os.walk(root):
            for fn in files:
                low = fn.lower()
                if low.endswith(FONT_EXT):
                    names.update(families_from_file(os.path.join(dirpath, fn)))
    return names


def scan_system_profiler():
    """Everything macOS has registered, including fonts activated by font managers."""
    names = set()
    try:
        out = subprocess.run(["/usr/sbin/system_profiler", "SPFontsDataType", "-json"],
                             capture_output=True, timeout=120).stdout
        for font in json.loads(out).get("SPFontsDataType", []):
            for face in font.get("typefaces", []) or []:
                fam = face.get("family")
                if fam:
                    names.add(fam)
    except Exception:
        pass
    return names


def clean(names):
    return sorted(
        (n for n in names if n and not n.startswith((".", "#")) and n not in HIDDEN and len(n) < 120),
        key=str.casefold,
    )


def main():
    msg = read_message() or {}
    cmd = msg.get("cmd", "list")
    try:
        names = scan_files()
        if cmd == "deep":
            names |= scan_system_profiler()
        send_message({"ok": True, "fonts": clean(names)})
    except Exception as e:  # never leave Firefox hanging
        send_message({"ok": False, "error": str(e)})


if __name__ == "__main__":
    main()
