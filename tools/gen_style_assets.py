"""Generate the 5 local style bundles for Frontend Remix.
Each bundle: fonts.css, borders.css, buttons.css, spacing.css, layout.css, icons/*.svg
Every rule is scoped to html[data-frx-style="<id>"] so a leftover sheet is inert."""
import os, sys
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", "src", "assets")

BTN = ('button, input[type="button"], input[type="submit"], input[type="reset"], '
       '[role="button"], a.btn, a.button, .btn, .button')
FIELD = ('input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="button"])'
         ':not([type="submit"]):not([type="reset"]):not([type="image"]):not([type="file"]), textarea, select')
TEXT = 'body, p, li, td, th, dd, dt, blockquote, label, span, a, div, button, input, textarea, select'
HEAD = 'h1, h2, h3, h4, h5, h6'
# "tile"/"box" would also hit "title", "checkbox", "inbox" - keep the card hints specific
CARD = 'article, [class*="card" i], [class*="panel" i]'

STYLES = {
  "flat": dict(
    label="Flat",
    font='"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif', head_weight="600", head_font=None,
    unit=8, radius="0", bw="1px", bstyle="solid", bcolor="#d0d5dd",
    bg="#ffffff", fg="#1d2939", link="#2563eb",
    btn_bg="#2563eb", btn_fg="#ffffff", btn_border="1px solid #2563eb", btn_hover="#1d4ed8",
    btn_shadow="none", btn_weight="600", btn_extra="",
    card_bg="#ffffff", card_shadow="none", card_border="1px solid #e4e7ec",
    field_bg="#ffffff", field_border="1px solid #d0d5dd",
    icon_color="#2563eb", icon_stroke=2, icon_round="square",
  ),
  "material": dict(
    label="Material",
    font='Roboto, "Helvetica Neue", Arial, sans-serif', head_weight="500", head_font=None,
    unit=16, radius="6px", bw="0", bstyle="solid", bcolor="transparent",
    bg="#fafafa", fg="#212121", link="#6200ee",
    btn_bg="#6200ee", btn_fg="#ffffff", btn_border="none", btn_hover="#3700b3",
    btn_shadow="0 2px 4px rgba(0,0,0,.24), 0 1px 2px rgba(0,0,0,.12)", btn_weight="500",
    btn_extra="text-transform: uppercase !important; letter-spacing: .08em !important;",
    card_bg="#ffffff", card_shadow="0 1px 3px rgba(0,0,0,.2), 0 2px 8px rgba(0,0,0,.08)", card_border="none",
    field_bg="#f5f5f5", field_border="none !important; border-bottom: 2px solid #9e9e9e",
    icon_color="#6200ee", icon_stroke=2, icon_round="round",
  ),
  "brutalist": dict(
    label="Brutalist",
    font='"Courier New", Courier, monospace', head_weight="900",
    head_font='"Arial Black", Impact, "Helvetica Neue", Arial, sans-serif',
    unit=4, radius="0", bw="3px", bstyle="solid", bcolor="#000000",
    bg="#ffffff", fg="#000000", link="#0000ff",
    btn_bg="#ffff00", btn_fg="#000000", btn_border="4px solid #000000", btn_hover="#ff3b00",
    btn_shadow="6px 6px 0 #000000", btn_weight="900", btn_extra="text-transform: uppercase !important;",
    card_bg="#ffffff", card_shadow="8px 8px 0 #000000", card_border="3px solid #000000",
    field_bg="#ffffff", field_border="3px solid #000000",
    icon_color="#000000", icon_stroke=3.5, icon_round="square",
  ),
  "frutiger-aero": dict(
    label="Frutiger Aero",
    font='Frutiger, "Segoe UI", "Lucida Grande", "Helvetica Neue", Arial, sans-serif', head_weight="400", head_font=None,
    unit=12, radius="12px", bw="1px", bstyle="solid", bcolor="rgba(120,170,220,.7)",
    bg="linear-gradient(180deg, #e8f6ff 0%, #bfe3ff 45%, #e9f9e9 100%) fixed", fg="#12324d", link="#0a6ccc",
    btn_bg="linear-gradient(180deg, #ffffff 0%, #d6ecff 48%, #9ccfff 52%, #c9e6ff 100%)", btn_fg="#0b3a66",
    btn_border="1px solid #6aa9e0", btn_hover="linear-gradient(180deg, #ffffff 0%, #e3f3ff 48%, #7fc1ff 52%, #b8e0ff 100%)",
    btn_shadow="0 2px 6px rgba(30,110,190,.35), inset 0 1px 0 rgba(255,255,255,.9)", btn_weight="600", btn_extra="",
    card_bg="rgba(255,255,255,.55)", card_shadow="0 8px 24px rgba(30,110,190,.18), inset 0 1px 0 rgba(255,255,255,.8)",
    card_border="1px solid rgba(255,255,255,.8)",
    field_bg="rgba(255,255,255,.85)", field_border="1px solid #8cc2ef",
    icon_color="#1677d2", icon_stroke=2, icon_round="round",
  ),
  "claymation": dict(
    label="Claymation",
    font='"Comic Sans MS", "Chalkboard SE", "Marker Felt", "Arial Rounded MT Bold", sans-serif',
    head_weight="700", head_font='"Arial Rounded MT Bold", "Chalkboard SE", "Comic Sans MS", sans-serif',
    unit=16, radius="18px", bw="3px", bstyle="solid", bcolor="#5b4636",
    bg="#f4e6d4", fg="#4a3a2c", link="#c0563a",
    btn_bg="#e98a6b", btn_fg="#3b2a1e", btn_border="3px solid #5b4636", btn_hover="#f2a283",
    btn_shadow="0 5px 0 #5b4636, 0 8px 14px rgba(91,70,54,.25)", btn_weight="700", btn_extra="",
    card_bg="#fbf3e8", card_shadow="0 6px 0 #d9c3a8, 0 10px 18px rgba(91,70,54,.18)", card_border="3px solid #5b4636",
    field_bg="#fffaf3", field_border="3px solid #5b4636",
    icon_color="#c0563a", icon_stroke=3, icon_round="round",
  ),
}

# ---- layout-context aware rules -------------------------------------------------
# The content script tags elements with data-frx-fit before the style turns on:
#   (no attribute)  normal flow: block content that grows with what's inside it
#   "item"          child of a flex / grid container: spacing comes from the container's
#                   gap, so the style leaves the item's own margins alone
#   "fixed"         static / fixed-size box (or anything that overflowed when styled):
#                   only visual changes, nothing that moves or resizes. Applies to the
#                   whole subtree, so content added later inside it is covered too.
FIXED = '[data-frx-fit="fixed"], [data-frx-fit="fixed"] *'
NOT_FIXED = ':not(%s)' % FIXED                         # padding / border width / gap
FLOW_ONLY = ':not([data-frx-fit], [data-frx-fit="fixed"] *)'   # margins
IN_FIXED = ':is(%s)' % FIXED
OUTER = ("margin",)
INNER = ("padding", "border", "gap", "row-gap", "column-gap", "letter-spacing",
         "text-transform", "font-size", "line-height", "width", "height")
VISUAL_BORDER = ("border-radius", "border-color", "border-top-color", "border-right-color",
                 "border-bottom-color", "border-left-color")

def split_top(text, sep):
    """Split on `sep` only outside (), [] and quotes."""
    out, depth, quote, cur = [], 0, None, ""
    for ch in text:
        if quote:
            quote = None if ch == quote else quote
        elif ch in "\"'":
            quote = ch
        elif ch in "([":
            depth += 1
        elif ch in ")]":
            depth -= 1
        elif ch == sep and depth == 0:
            out.append(cur); cur = ""; continue
        cur += ch
    out.append(cur)
    return [x.strip() for x in out if x.strip()]

def scope(sid, sel, ctx=""):
    return ", ".join('html[data-frx-style="%s"] %s%s' % (sid, part, ctx) for part in split_top(sel, ","))

def kind(prop):
    if prop in VISUAL_BORDER:
        return "visual"
    if prop.startswith(OUTER):
        return "outer"
    if prop.startswith(INNER):
        return "inner"
    return "visual"

def border_as_outline(value):
    """`3px solid #000` -> outline hugging the box: drawn, but takes no space."""
    parts = value.split()
    if not parts or parts[0] in ("none", "0", "0px") or not parts[0][0].isdigit():
        return None
    return "outline: %s !important; outline-offset: 0 !important;" % value

def rule(sid, sel, decls):
    """Emit one rule per layout context: visual everywhere, sizing only where it fits."""
    groups = {"visual": [], "inner": [], "outer": []}
    fixed_extra = []
    for d in split_top(decls, ";"):
        if ":" not in d:
            continue
        prop, val = [x.strip() for x in d.split(":", 1)]
        val = val.replace("!important", "").strip()
        groups[kind(prop)].append("%s: %s !important;" % (prop, val))
        if prop == "border":
            o = border_as_outline(val)
            if o:
                fixed_extra.append(o)
    out = []
    if groups["visual"]:
        out.append("%s { %s }" % (scope(sid, sel), " ".join(groups["visual"])))
    if groups["inner"]:
        out.append("%s { %s }" % (scope(sid, sel, NOT_FIXED), " ".join(groups["inner"])))
    if groups["outer"]:
        out.append("%s { %s }" % (scope(sid, sel, FLOW_ONLY), " ".join(groups["outer"])))
    if fixed_extra:
        out.append("%s { %s }" % (scope(sid, sel, IN_FIXED), " ".join(fixed_extra)))
    return "\n".join(out)

def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(text.strip() + "\n")

ICONS = {
  "check":    '<polyline points="5 12.5 10 17.5 19 7"/>',
  "arrow":    '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/>',
  "close":    '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
  "settings": '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M5.5 18.5l2.1-2.1M16.4 7.6l2.1-2.1"/>',
}

for sid, s in STYLES.items():
    d = os.path.join(OUT, sid)
    u = s["unit"]
    head_font = s["head_font"] or s["font"]
    write(os.path.join(d, "spacing.css"), "\n".join([
        f"/* {s['label']} - spacing scale ({u}px grid). Margins only apply in normal flow; */",
        "/* flex / grid items get spacing from the container gap, fixed boxes keep theirs. */",
        f'html[data-frx-style="{sid}"] {{ --frx-unit: {u}px; --frx-gap: {u * 2}px; '
        f'--frx-margin-base: {u * 2}px; --frx-radius: {s["radius"]}; }}',
        rule(sid, HEAD, "margin-top: calc(var(--frx-unit) * 3); margin-bottom: var(--frx-unit)"),
        rule(sid, "p, ul, ol, blockquote", "margin-bottom: var(--frx-margin-base)"),
        rule(sid, ':is(article, [class*="card" i], [class*="panel" i]) > :is(h1, h2, h3, h4, h5, h6):first-child',
             "margin-top: 0"),
        # flex / grid containers: space their items with gap instead of margins
        rule(sid, '[data-frx-gap]', "gap: var(--frx-unit)"),
    ]))
    write(os.path.join(d, "fonts.css"), "\n".join([
        f"/* {s['label']} - typography (local/system font stacks: nothing is downloaded) */",
        rule(sid, TEXT, f"font-family: {s['font']}"),
        rule(sid, HEAD, f"font-family: {head_font}; font-weight: {s['head_weight']}; color: {s['fg']}"),
        rule(sid, "a", f"color: {s['link']}"),
        rule(sid, "code, pre, kbd, samp", 'font-family: Menlo, Consolas, "Courier New", monospace'),
    ]))
    line = s['bw'] if s['bw'] != '0' else '1px'
    lcol = s['bcolor'] if s['bw'] != '0' else 'rgba(0,0,0,.12)'
    write(os.path.join(d, "borders.css"), "\n".join([
        f"/* {s['label']} - borders (fixed-size boxes get an outline instead of a wider border) */",
        rule(sid, CARD, f"border-radius: {s['radius']}"),
        rule(sid, "img, video, iframe", f"border-radius: {s['radius']}"),
        rule(sid, "hr", f"border: 0; border-top: {line} {s['bstyle']} {lcol}"),
        rule(sid, "table, th, td", f"border-color: {lcol}"),
        rule(sid, FIELD, f"background: {s['field_bg']}; color: {s['fg']}; border: {s['field_border']}; "
                         f"border-radius: {s['radius']}; padding: calc(var(--frx-unit) * .75) var(--frx-unit)"),
    ]))
    write(os.path.join(d, "buttons.css"), "\n".join([
        f"/* {s['label']} - buttons */",
        rule(sid, BTN, f"background: {s['btn_bg']}; color: {s['btn_fg']}; border: {s['btn_border']}; "
                       f"border-radius: {s['radius']}; box-shadow: {s['btn_shadow']}; font-weight: {s['btn_weight']}; "
                       f"padding: var(--frx-unit) calc(var(--frx-unit) * 2); font-family: {s['font']}; cursor: pointer; "
                       f"transition: background .15s, transform .1s, box-shadow .15s; {s['btn_extra']}"),
        rule(sid, BTN.replace(', ', ':hover, ') + ':hover', f"background: {s['btn_hover']}"),
        rule(sid, BTN.replace(', ', ':active, ') + ':active',
             f"transform: translateY({'2px' if sid in ('claymation', 'brutalist') else '1px'})"),
    ]))
    write(os.path.join(d, "layout.css"), "\n".join([
        f"/* {s['label']} - layout: page surface + card / section treatment */",
        rule(sid, "body", f"background: {s['bg']}; color: {s['fg']}"),
        rule(sid, CARD, f"background: {s['card_bg']}; box-shadow: {s['card_shadow']}; border: {s['card_border']}"),
        rule(sid, 'article, [class*="card" i]', "padding: calc(var(--frx-unit) * 1.5)"),
    ]))
    for name, body in ICONS.items():
        write(os.path.join(d, "icons", name + ".svg"),
              f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="{s["icon_color"]}" '
              f'stroke-width="{s["icon_stroke"]}" stroke-linecap="{s["icon_round"]}" '
              f'stroke-linejoin="{"round" if s["icon_round"] == "round" else "miter"}">{body}</svg>')
print("ok")
