#######################
######## TO DO ########
#######################

# Choose between include seventh chords, do not include seventh chords.
# Choose between generate two chords, three chords, or four chords.



import tkinter as tk
import random

from chord_library import CHORDS


def add_transposed_chords(CHORDS, root_chord, shape, new_roots_with_transpose):
    if root_chord not in CHORDS or shape not in CHORDS[root_chord]:
        raise ValueError(f"Root chord '{root_chord}' or shape '{shape}' not found in the dictionary.")
    for quality, chord_shapes in CHORDS[root_chord][shape].items():
        original_chord = chord_shapes[0]
        original_chord_list = original_chord.split(", ")
        for new_root, transpose_by in new_roots_with_transpose:
            transposed_chord = []
            for fret in original_chord_list:
                if fret == 'x':
                    transposed_chord.append(fret)
                else:
                    transposed_chord.append(str(int(fret) + transpose_by))
            transposed_chord_str = ", ".join(transposed_chord)
            if new_root not in CHORDS:
                CHORDS[new_root] = {}
            if shape not in CHORDS[new_root]:
                CHORDS[new_root][shape] = {}
            if quality not in CHORDS[new_root][shape]:
                CHORDS[new_root][shape][quality] = []
            CHORDS[new_root][shape][quality].append(transposed_chord_str)


add_transposed_chords(CHORDS, "A", "A shape", [("B",2),("C",3),("D",5),("E",7),("F",8),("G",10),("A",12)])
add_transposed_chords(CHORDS, "C", "C shape", [("D",2),("E",4),("F",5),("G",7),("A",9),("B",11),("C",12)])
add_transposed_chords(CHORDS, "E", "E shape", [("F",1),("G",3),("A",5),("B",7),("C",8),("D",10),("E",12)])
add_transposed_chords(CHORDS, "D", "D shape", [("E",2),("F",3),("G",5),("A",7),("B",9),("C",10),("D",12)])
add_transposed_chords(CHORDS, "G", "G shape", [("A",2),("B",4),("C",5),("D",7),("E",9),("F",10),("D",12)])


def pick_random_chord():
    def is_valid(chord):
        return chord != "x, x, x, x, x, x"
    while True:
        name, data      = random.choice(list(CHORDS.items()))
        shape, variants = random.choice(list(data.items()))
        quality, shapes = random.choice(list(variants.items()))
        chord = shapes[0]
        if is_valid(chord):
            return (f"{name} {quality} ({shape})", chord)


def pick_random_chords(n):
    return [pick_random_chord() for _ in range(n)]


# ---------------------------------------------------------------------------
# Theme definitions
# ---------------------------------------------------------------------------
THEMES = {
    "dark": {
        "BG":          "#1c1c1a",
        "CARD_BG":     "#252523",
        "CARD_BORDER": "#3a3a37",
        "BOARD_BG":    "#f5efe0",
        "NUT_COLOR":   "#5a4a2a",
        "FRET_COLOR":  "#b0a07a",
        "STRING_COLOR":"#8a7a5a",
        "DOT_FILL":    "#2c2c2a",
        "OPEN_STROKE": "#2c2c2a",
        "MUTED_COLOR": "#999999",
        "FRET_NUM_FG": "#888888",
        "LABEL_DIM":   "#666664",
        "LABEL_LIT":   "#e8e4da",
        "BTN_BG":      "#2e2e2b",
        "BTN_FG":      "#e0dbd0",
        "BTN_ACTIVE":  "#3a3a37",
        "BTN_SEL_BG":  "#4a4a46",
        "BTN_SEL_FG":  "#e8e4da",
        "HINT_FG":     "#555553",
        "TITLE_FG":    "#c8c4ba",
    },
    "light": {
        "BG":          "#f0ede8",
        "CARD_BG":     "#ffffff",
        "CARD_BORDER": "#d0ccc5",
        "BOARD_BG":    "#f5efe0",
        "NUT_COLOR":   "#5a4a2a",
        "FRET_COLOR":  "#b0a07a",
        "STRING_COLOR":"#8a7a5a",
        "DOT_FILL":    "#2c2c2a",
        "OPEN_STROKE": "#2c2c2a",
        "MUTED_COLOR": "#aaaaaa",
        "FRET_NUM_FG": "#888888",
        "LABEL_DIM":   "#aaa9a6",
        "LABEL_LIT":   "#1c1c1a",
        "BTN_BG":      "#e4e0da",
        "BTN_FG":      "#2c2c2a",
        "BTN_ACTIVE":  "#d0ccc5",
        "BTN_SEL_BG":  "#2c2c2a",
        "BTN_SEL_FG":  "#f0ede8",
        "HINT_FG":     "#aaa9a6",
        "TITLE_FG":    "#3a3835",
    },
}

# Active theme colours (mutable dict, updated by _apply_theme)
T = dict(THEMES["dark"])

DIAGRAM_FILL = 0.52


# ---------------------------------------------------------------------------
# Drawing
# ---------------------------------------------------------------------------

def draw_chord_diagram(canvas, chord, x_offset, y_offset, card_w, card_h):
    frets = chord.split(", ")
    numeric = [int(f) for f in frets if f != "x"]
    if not numeric:
        return
    lowest = min(numeric)

    usable_w = card_w * DIAGRAM_FILL
    usable_h = card_h * DIAGRAM_FILL
    STRING_SPACING = usable_w / 5
    FRET_SPACING   = usable_h / 4
    GRID_W = STRING_SPACING * 5
    GRID_H = FRET_SPACING   * 4

    dot_r           = max(4, STRING_SPACING * 0.30)
    open_r          = max(3, STRING_SPACING * 0.24)
    nut_width       = max(2, FRET_SPACING * 0.07)
    fret_num_sz     = max(7, int(FRET_SPACING * 0.20))
    marker_sz       = max(8, int(STRING_SPACING * 0.42))
    fret_num_margin = fret_num_sz * 2.2
    marker_gap      = open_r * 2 + 6

    bx = x_offset + (card_w - fret_num_margin - GRID_W) / 2 + fret_num_margin
    by = y_offset + marker_gap + 4

    canvas.create_rectangle(bx, by, bx + GRID_W, by + GRID_H, fill=T["BOARD_BG"], outline="")

    for i in range(5):
        y = by + i * FRET_SPACING
        canvas.create_line(bx, y, bx + GRID_W, y,
                           fill=T["NUT_COLOR"] if i == 0 else T["FRET_COLOR"],
                           width=nut_width if i == 0 else max(1, nut_width * 0.4))

    for i in range(6):
        x = bx + i * STRING_SPACING
        thickness = max(1, round(1 + (5 - i) * 0.2))
        canvas.create_line(x, by, x, by + GRID_H, fill=T["STRING_COLOR"], width=thickness)

    if lowest > 0:
        canvas.create_text(
            bx - fret_num_sz * 0.6, by + FRET_SPACING * 0.5,
            text=str(lowest), font=("Helvetica", fret_num_sz), fill=T["FRET_NUM_FG"], anchor="e"
        )

    for string_idx, fret in enumerate(frets):
        x = bx + string_idx * STRING_SPACING
        if fret == "x":
            canvas.create_text(
                x, by - marker_gap / 2,
                text="✕", font=("Helvetica", marker_sz, "bold"), fill=T["MUTED_COLOR"]
            )
        else:
            fret_num = int(fret)
            if fret_num == 0:
                canvas.create_oval(
                    x - open_r, by - marker_gap + 1,
                    x + open_r, by - marker_gap + 1 + open_r * 2,
                    outline=T["OPEN_STROKE"], width=max(1, open_r * 0.25), fill=T["BOARD_BG"]
                )
            else:
                row = fret_num - lowest
                y = by + row * FRET_SPACING + FRET_SPACING / 2
                canvas.create_oval(
                    x - dot_r, y - dot_r, x + dot_r, y + dot_r,
                    fill=T["DOT_FILL"], outline=""
                )


def _draw_card(canvas, x1, y1, x2, y2, radius=10):
    r = radius
    canvas.create_polygon(
        x1+r, y1,   x2-r, y1,
        x2,   y1+r, x2,   y2-r,
        x2,   y2,   x1,   y2,
        x1,   y2-r, x1,   y1+r,
        smooth=True, fill=T["CARD_BG"], outline=T["CARD_BORDER"], width=1
    )


# ---------------------------------------------------------------------------
# UI logic
# ---------------------------------------------------------------------------

def display_chord_names(event=None):
    global chord_names_revealed
    if not chord_names_revealed:
        for i, (name, _) in enumerate(current_chords):
            chord_labels[i].config(text=name, fg=T["LABEL_LIT"])
        reveal_btn.config(text="Next  →")
        chord_names_revealed = True
    else:
        display_chords()


def display_chords(event=None):
    global current_chords, chord_names_revealed
    chord_names_revealed = False
    current_chords = pick_random_chords(chord_count.get())
    _rebuild_labels()
    _redraw()


def _rebuild_labels():
    for w in label_frame.winfo_children():
        w.destroy()
    chord_labels.clear()
    for _ in range(chord_count.get()):
        lbl = tk.Label(label_frame, text="?", font=("Helvetica", 11),
                       bg=T["BG"], fg=T["LABEL_DIM"], anchor="center")
        lbl.pack(side="left", expand=True, fill="x")
        chord_labels.append(lbl)


def _redraw(event=None):
    canvas.delete("all")

    n   = len(current_chords)
    cw  = canvas.winfo_width()  or 760
    ch  = canvas.winfo_height() or 320
    pad = 10
    gap = 8
    card_w = (cw - pad * 2 - gap * (n - 1)) // n
    card_h = ch - pad * 2

    for i, (name, chord) in enumerate(current_chords):
        x1 = pad + i * (card_w + gap)
        x2 = x1 + card_w
        _draw_card(canvas, x1, pad, x2, pad + card_h)
        draw_chord_diagram(canvas, chord,
                           x_offset=x1, y_offset=pad + 20,
                           card_w=card_w, card_h=card_h)

    for i, lbl in enumerate(chord_labels):
        if chord_names_revealed:
            lbl.config(text=current_chords[i][0], fg=T["LABEL_LIT"])
        else:
            lbl.config(text="?", fg=T["LABEL_DIM"])


def _on_count_change(n):
    chord_count.set(n)
    for val, btn in count_buttons.items():
        sel = val == n
        btn.config(bg=T["BTN_SEL_BG"] if sel else T["BTN_BG"],
                   fg=T["BTN_SEL_FG"] if sel else T["BTN_FG"])
    display_chords()


def _apply_theme(name):
    """Switch theme and repaint every widget."""
    T.update(THEMES[name])

    root.configure(bg=T["BG"])
    canvas.configure(bg=T["BG"])

    for w in (title_frame, label_frame, btn_frame, hint_label_frame):
        w.configure(bg=T["BG"])

    title_lbl.configure(bg=T["BG"], fg=T["TITLE_FG"])
    subtitle_lbl.configure(bg=T["BG"], fg=T["HINT_FG"])
    hint_lbl.configure(bg=T["BG"], fg=T["HINT_FG"])

    # Theme toggle buttons
    for tname, tbtn in theme_buttons.items():
        sel = tname == name
        tbtn.config(bg=T["BTN_SEL_BG"] if sel else T["BTN_BG"],
                    fg=T["BTN_SEL_FG"] if sel else T["BTN_FG"],
                    activebackground=T["BTN_ACTIVE"], activeforeground=T["BTN_FG"])

    # Action + count buttons
    for btn in [reveal_btn, new_chords_btn]:
        btn.config(bg=T["BTN_BG"], fg=T["BTN_FG"],
                   activebackground=T["BTN_ACTIVE"], activeforeground=T["BTN_FG"])

    cur_count = chord_count.get()
    for val, btn in count_buttons.items():
        sel = val == cur_count
        btn.config(bg=T["BTN_SEL_BG"] if sel else T["BTN_BG"],
                   fg=T["BTN_SEL_FG"] if sel else T["BTN_FG"],
                   activebackground=T["BTN_ACTIVE"], activeforeground=T["BTN_FG"])

    chords_lbl.configure(bg=T["BG"], fg=T["HINT_FG"])

    # Rebuild labels so they pick up new colours
    _rebuild_labels()
    if chord_names_revealed:
        for i, (name_str, _) in enumerate(current_chords):
            chord_labels[i].config(text=name_str, fg=T["LABEL_LIT"])

    _redraw()


# ---------------------------------------------------------------------------
# Window & widgets
# ---------------------------------------------------------------------------
root = tk.Tk()
root.title("Chord Trainer")
root.configure(bg=T["BG"])
root.resizable(True, True)
root.minsize(620, 420)

# Title bar
title_frame = tk.Frame(root, bg=T["BG"])
title_frame.pack(fill="x", padx=16, pady=(14, 4))

title_lbl = tk.Label(title_frame, text="Chord trainer", font=("Helvetica", 14),
                     bg=T["BG"], fg=T["TITLE_FG"])
title_lbl.pack(side="left")

subtitle_lbl = tk.Label(title_frame, text="Identify the shapes, then reveal",
                        font=("Helvetica", 10), bg=T["BG"], fg=T["HINT_FG"])
subtitle_lbl.pack(side="left", padx=(10, 0), pady=(2, 0))

# Theme toggle (top-right)
theme_buttons = {}
for tname, label in (("light", "☀  Light"), ("dark", "☾  Dark")):
    b = tk.Button(
        title_frame, text=label,
        font=("Helvetica", 10),
        bg=T["BTN_SEL_BG"] if tname == "dark" else T["BTN_BG"],
        fg=T["BTN_SEL_FG"] if tname == "dark" else T["BTN_FG"],
        activebackground=T["BTN_ACTIVE"], activeforeground=T["BTN_FG"],
        relief="flat", padx=10, pady=4, cursor="hand2",
        command=lambda n=tname: _apply_theme(n)
    )
    b.pack(side="right", padx=2)
    theme_buttons[tname] = b

# Canvas
canvas = tk.Canvas(root, bg=T["BG"], highlightthickness=0)
canvas.pack(fill="both", expand=True, padx=10)

# Chord name labels
label_frame = tk.Frame(root, bg=T["BG"])
label_frame.pack(fill="x", padx=10, pady=(6, 0))
chord_labels = []

# Button row
btn_frame = tk.Frame(root, bg=T["BG"])
btn_frame.pack(pady=10)

reveal_btn = tk.Button(
    btn_frame, text="Reveal names",
    font=("Helvetica", 11), bg=T["BTN_BG"], fg=T["BTN_FG"],
    activebackground=T["BTN_ACTIVE"], activeforeground=T["BTN_FG"],
    relief="flat", padx=18, pady=7, cursor="hand2",
    command=display_chord_names
)
reveal_btn.pack(side="left", padx=6)

new_chords_btn = tk.Button(
    btn_frame, text="New chords",
    font=("Helvetica", 11), bg=T["BTN_BG"], fg=T["BTN_FG"],
    activebackground=T["BTN_ACTIVE"], activeforeground=T["BTN_FG"],
    relief="flat", padx=18, pady=7, cursor="hand2",
    command=display_chords
)
new_chords_btn.pack(side="left", padx=6)

chords_lbl = tk.Label(btn_frame, text="  chords:", font=("Helvetica", 10),
                      bg=T["BG"], fg=T["HINT_FG"])
chords_lbl.pack(side="left", padx=(12, 4))

chord_count = tk.IntVar(value=2)
count_buttons = {}
for n in (2, 3, 4):
    b = tk.Button(
        btn_frame, text=str(n),
        font=("Helvetica", 11),
        bg=T["BTN_SEL_BG"] if n == 2 else T["BTN_BG"],
        fg=T["BTN_SEL_FG"] if n == 2 else T["BTN_FG"],
        activebackground=T["BTN_ACTIVE"], activeforeground=T["BTN_FG"],
        relief="flat", padx=10, pady=7, cursor="hand2",
        command=lambda val=n: _on_count_change(val)
    )
    b.pack(side="left", padx=2)
    count_buttons[n] = b

hint_label_frame = tk.Frame(root, bg=T["BG"])
hint_label_frame.pack()
hint_lbl = tk.Label(hint_label_frame, text="Space or Enter to reveal / advance",
                    font=("Helvetica", 9), bg=T["BG"], fg=T["HINT_FG"])
hint_lbl.pack(pady=(0, 10))

# Keybindings
root.bind("<Return>", display_chord_names)
root.bind("<space>",  display_chord_names)
canvas.bind("<Configure>", _redraw)

chord_names_revealed = False
current_chords = pick_random_chords(2)
_rebuild_labels()
root.mainloop()