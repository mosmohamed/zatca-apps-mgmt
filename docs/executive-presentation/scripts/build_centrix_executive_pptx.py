#!/usr/bin/env python3
"""
CENTRIX — Premium Executive PowerPoint
Aligned to ZATCA Brand Identity (2025 visual system).

Brand palette (from Brand Identity.pdf):
  Primary:  #0E2547  #002F87  #009ADE  #10CFC9  #00828E  #156342
  Accent:   #F26652  #E5B46E  #87A96B  #6E3580
Typography: Somar (fallback: Calibri)
"""

from __future__ import annotations

from pathlib import Path

from pptx import Presentation
from pptx.chart.data import CategoryChartData
from pptx.dml.color import RGBColor
from pptx.enum.chart import XL_CHART_TYPE, XL_LEGEND_POSITION
from pptx.enum.shapes import MSO_CONNECTOR, MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Inches, Pt, Emu
from lxml import etree

# ─── ZATCA Brand Colors ─────────────────────────────────────────────────────
NAVY = RGBColor(0x0E, 0x25, 0x47)       # Pantone 0e2547
ROYAL = RGBColor(0x00, 0x2F, 0x87)      # Pantone 002f87
AZURE = RGBColor(0x00, 0x9A, 0xDE)      # Pantone 009ade
CYAN = RGBColor(0x10, 0xCF, 0xC9)       # Pantone 10cfc9
TEAL = RGBColor(0x00, 0x82, 0x8E)       # Pantone 00828e
FOREST = RGBColor(0x15, 0x63, 0x42)     # Pantone 156342
CORAL = RGBColor(0xF2, 0x66, 0x52)      # Pantone f26652
GOLD = RGBColor(0xE5, 0xB4, 0x6E)       # Pantone e5b46e
SAGE = RGBColor(0x87, 0xA9, 0x6B)       # Pantone 87a96b
PURPLE = RGBColor(0x6E, 0x35, 0x80)     # Pantone 6e3580
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
LIGHT = RGBColor(0xF5, 0xF7, 0xFA)
MUTED = RGBColor(0x5C, 0x6B, 0x7A)
SLATE = RGBColor(0x3A, 0x4A, 0x5A)
LINE = RGBColor(0xD9, 0xE2, 0xEC)

FONT = "Calibri"  # Somar unavailable → closest enterprise alternative
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "CENTRIX-Executive-Briefing.pptx"

SW = Inches(13.333)
SH = Inches(7.5)
TOTAL = 16


# ─── Helpers ────────────────────────────────────────────────────────────────

def rgb(run, color: RGBColor):
    run.font.color.rgb = color


def style(run, text: str, size: int, bold: bool = False, color: RGBColor = NAVY):
    run.text = text
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.name = FONT
    run.font.color.rgb = color


def set_text(shape, text: str, size: int, bold: bool = False, color: RGBColor = NAVY, align=PP_ALIGN.LEFT):
    tf = shape.text_frame
    tf.clear()
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    style(p.add_run(), text, size, bold, color)


def add_p(tf, text: str, size: int, bold: bool = False, color: RGBColor = SLATE, before: int = 4):
    p = tf.add_paragraph()
    p.space_before = Pt(before)
    p.alignment = PP_ALIGN.LEFT
    style(p.add_run(), text, size, bold, color)
    return p


def blank(prs: Presentation):
    return prs.slides.add_slide(prs.slide_layouts[6])


def notes(slide, text: str):
    slide.notes_slide.notes_text_frame.text = text


def top_bar(slide, color: RGBColor = ROYAL):
    s = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), SW, Inches(0.08))
    s.fill.solid()
    s.fill.fore_color.rgb = color
    s.line.fill.background()


def footer(slide, section: str, page: int):
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.55), Inches(7.05), Inches(12.2), Inches(0.01))
    line.fill.solid()
    line.fill.fore_color.rgb = LINE
    line.line.fill.background()
    left = slide.shapes.add_textbox(Inches(0.55), Inches(7.12), Inches(9), Inches(0.28))
    set_text(left, f"CENTRIX  ·  {section}  ·  Confidential", 9, False, MUTED)
    right = slide.shapes.add_textbox(Inches(11.2), Inches(7.12), Inches(1.5), Inches(0.28))
    set_text(right, f"{page:02d}  /  {TOTAL:02d}", 9, False, MUTED, PP_ALIGN.RIGHT)


def eyebrow(slide, text: str, top: float = 0.28):
    box = slide.shapes.add_textbox(Inches(0.55), Inches(top), Inches(12), Inches(0.28))
    set_text(box, text.upper(), 10, True, AZURE)


def heading(slide, text: str, top: float = 0.52, size: int = 28):
    box = slide.shapes.add_textbox(Inches(0.55), Inches(top), Inches(12.2), Inches(0.55))
    set_text(box, text, size, True, NAVY)


def key_msg(slide, text: str, top: float = 1.05):
    box = slide.shapes.add_textbox(Inches(0.55), Inches(top), Inches(12.2), Inches(0.35))
    set_text(box, text, 13, False, MUTED)


def card(slide, left, top, width, height, fill: RGBColor = WHITE, border: RGBColor = LINE):
    s = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    s.line.color.rgb = border
    s.line.width = Pt(1)
    try:
        s.adjustments[0] = 0.06
    except Exception:
        pass
    return s


def accent_strip(slide, left, top, height, color: RGBColor = AZURE, width: float = 0.07):
    s = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, Inches(width), height)
    s.fill.solid()
    s.fill.fore_color.rgb = color
    s.line.fill.background()
    return s


def kpi(slide, left, top, w, h, value: str, label: str, color: RGBColor = AZURE):
    c = card(slide, left, top, w, h, WHITE, LINE)
    accent_strip(slide, left, top, h, color)
    v = slide.shapes.add_textbox(left + Inches(0.22), top + Inches(0.22), w - Inches(0.3), Inches(0.5))
    set_text(v, value, 26, True, NAVY)
    l = slide.shapes.add_textbox(left + Inches(0.22), top + Inches(0.75), w - Inches(0.3), Inches(0.4))
    set_text(l, label, 11, False, MUTED)
    return c


def icon_badge(slide, left, top, size, label: str, fill: RGBColor = ROYAL):
    """Circular badge with short label (icon substitute — editable)."""
    oval = slide.shapes.add_shape(MSO_SHAPE.OVAL, left, top, size, size)
    oval.fill.solid()
    oval.fill.fore_color.rgb = fill
    oval.line.fill.background()
    tb = slide.shapes.add_textbox(left, top + size * 0.28, size, size * 0.5)
    set_text(tb, label, 10, True, WHITE, PP_ALIGN.CENTER)
    return oval


def placeholder(slide, left, top, width, height, label: str, sub: str = "Screenshot placeholder — replace with product image"):
    """Labeled media placeholder with fixed aspect for later screenshot swap."""
    outer = card(slide, left, top, width, height, LIGHT, LINE)
    # inner screen frame
    pad = Inches(0.18)
    inner = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE,
        left + pad,
        top + pad,
        width - pad * 2,
        height - pad * 2,
    )
    inner.fill.solid()
    inner.fill.fore_color.rgb = WHITE
    inner.line.color.rgb = LINE
    try:
        inner.adjustments[0] = 0.04
    except Exception:
        pass
    title = slide.shapes.add_textbox(left + Inches(0.35), top + height / 2 - Inches(0.45), width - Inches(0.7), Inches(0.4))
    set_text(title, f"[ {label} ]", 16, True, ROYAL, PP_ALIGN.CENTER)
    hint = slide.shapes.add_textbox(left + Inches(0.35), top + height / 2 + Inches(0.05), width - Inches(0.7), Inches(0.35))
    set_text(hint, sub, 10, False, MUTED, PP_ALIGN.CENTER)
    return outer


def laptop_placeholder(slide, left, top, width, height, label: str):
    """Laptop-style mockup frame for dashboard-class screenshots (~16:10 content)."""
    # base / chassis
    chassis = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height - Inches(0.25))
    chassis.fill.solid()
    chassis.fill.fore_color.rgb = NAVY
    chassis.line.fill.background()
    try:
        chassis.adjustments[0] = 0.04
    except Exception:
        pass
    # screen
    screen = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE,
        left + Inches(0.12),
        top + Inches(0.12),
        width - Inches(0.24),
        height - Inches(0.55),
    )
    screen.fill.solid()
    screen.fill.fore_color.rgb = LIGHT
    screen.line.fill.background()
    try:
        screen.adjustments[0] = 0.03
    except Exception:
        pass
    # chin
    chin = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE,
        left + Inches(0.8),
        top + height - Inches(0.28),
        width - Inches(1.6),
        Inches(0.12),
    )
    chin.fill.solid()
    chin.fill.fore_color.rgb = RGBColor(0x1A, 0x35, 0x55)
    chin.line.fill.background()

    t = slide.shapes.add_textbox(
        left + Inches(0.3),
        top + (height - Inches(0.55)) / 2,
        width - Inches(0.6),
        Inches(0.4),
    )
    set_text(t, f"[ {label} Screenshot Placeholder ]", 14, True, ROYAL, PP_ALIGN.CENTER)
    s = slide.shapes.add_textbox(
        left + Inches(0.3),
        top + (height - Inches(0.55)) / 2 + Inches(0.35),
        width - Inches(0.6),
        Inches(0.3),
    )
    set_text(s, "16:10 · replace without changing layout", 10, False, MUTED, PP_ALIGN.CENTER)


def chevron(slide, left, top, w, h, text: str, fill: RGBColor):
    s = slide.shapes.add_shape(MSO_SHAPE.CHEVRON, left, top, w, h)
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    s.line.fill.background()
    set_text(s, text, 11, True, WHITE, PP_ALIGN.CENTER)
    return s


def add_donut(slide, left, top, w, h, cats, vals):
    data = CategoryChartData()
    data.categories = cats
    data.add_series("Status", vals)
    chart = slide.shapes.add_chart(XL_CHART_TYPE.DOUGHNUT, left, top, w, h, data).chart
    chart.has_legend = True
    chart.legend.position = XL_LEGEND_POSITION.BOTTOM
    chart.legend.include_in_layout = False
    return chart


def add_pie(slide, left, top, w, h, cats, vals):
    data = CategoryChartData()
    data.categories = cats
    data.add_series("Share", vals)
    chart = slide.shapes.add_chart(XL_CHART_TYPE.PIE, left, top, w, h, data).chart
    chart.has_legend = True
    chart.legend.position = XL_LEGEND_POSITION.BOTTOM
    return chart


def add_bar(slide, left, top, w, h, cats, vals, color: RGBColor = AZURE):
    data = CategoryChartData()
    data.categories = cats
    data.add_series("Count", vals)
    chart = slide.shapes.add_chart(XL_CHART_TYPE.COLUMN_CLUSTERED, left, top, w, h, data).chart
    chart.has_legend = False
    chart.series[0].format.fill.solid()
    chart.series[0].format.fill.fore_color.rgb = color
    return chart


def add_stacked(slide, left, top, w, h, cats, series: dict):
    data = CategoryChartData()
    data.categories = cats
    for name, vals in series.items():
        data.add_series(name, vals)
    chart = slide.shapes.add_chart(XL_CHART_TYPE.COLUMN_STACKED, left, top, w, h, data).chart
    chart.has_legend = True
    chart.legend.position = XL_LEGEND_POSITION.BOTTOM
    return chart


def add_line(slide, left, top, w, h, cats, vals):
    data = CategoryChartData()
    data.categories = cats
    data.add_series("Applications", vals)
    chart = slide.shapes.add_chart(XL_CHART_TYPE.LINE_MARKERS, left, top, w, h, data).chart
    chart.has_legend = False
    return chart


def fade_transition(slide):
    """Add a subtle fade transition between slides."""
    nsmap = {"p": "http://schemas.openxmlformats.org/presentationml/2006/main"}
    sld = slide._element
    # remove existing transition
    for child in list(sld):
        if child.tag == qn("p:transition"):
            sld.remove(child)
    tr = etree.SubElement(sld, qn("p:transition"))
    tr.set("spd", "med")
    etree.SubElement(tr, qn("p:fade"))


# ─── Slides ─────────────────────────────────────────────────────────────────

def s01_title(prs):
    s = blank(prs)
    # full navy panel
    bg = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), SW, SH)
    bg.fill.solid()
    bg.fill.fore_color.rgb = NAVY
    bg.line.fill.background()
    # cyan accent rail
    rail = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(0.18), SH)
    rail.fill.solid()
    rail.fill.fore_color.rgb = CYAN
    rail.line.fill.background()
    # brand mark
    eye = s.shapes.add_textbox(Inches(0.9), Inches(1.55), Inches(11), Inches(0.35))
    set_text(eye, "ZATCA  ·  ENTERPRISE IT GOVERNANCE", 11, True, CYAN)
    brand = s.shapes.add_textbox(Inches(0.9), Inches(2.15), Inches(11.5), Inches(0.85))
    set_text(brand, "CENTRIX", 54, True, WHITE)
    sub = s.shapes.add_textbox(Inches(0.9), Inches(3.1), Inches(11), Inches(0.5))
    set_text(sub, "Enterprise IT Portfolio & Access Governance Platform", 20, False, AZURE)
    tag = s.shapes.add_textbox(Inches(0.9), Inches(3.9), Inches(10.5), Inches(0.7))
    set_text(
        tag,
        "Transforming IT Governance Through Centralization,\nAutomation and Visibility",
        16,
        False,
        RGBColor(0xB8, 0xC5, 0xD6),
    )
    meta = s.shapes.add_textbox(Inches(0.9), Inches(5.6), Inches(11), Inches(0.5))
    set_text(meta, "Executive Briefing  ·  Senior Management  ·  Confidential", 12, False, RGBColor(0x7A, 0x8B, 0x9C))
    notes(
        s,
        "Open with CENTRIX as a governance vision — not a product tour. "
        "Audience: CIO, IT Directors, Department Managers, Executive Management. "
        "Promise: one trusted platform for portfolio, license, identity, and decision support.",
    )
    fade_transition(s)


def s02_exec_summary(prs):
    s = blank(prs)
    top_bar(s)
    eyebrow(s, "01  ·  Executive Summary")
    heading(s, "One platform. One truth. Better control.")
    key_msg(s, "Key message: Fragmented IT records become governed enterprise intelligence.")

    cols = [
        (CORAL, "Current Challenges", "Spreadsheets, unknown ownership,\nmanual licenses, weak audit evidence"),
        (AZURE, "Business Opportunity", "Centralize portfolio, licenses,\nidentity, and executive visibility"),
        (FOREST, "Expected Outcome", "Lower risk · lower waste ·\nfaster audits · clearer decisions"),
    ]
    for i, (color, title, body) in enumerate(cols):
        left = Inches(0.55 + i * 4.15)
        c = card(s, left, Inches(1.7), Inches(3.95), Inches(4.5))
        hdr = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, Inches(1.7), Inches(3.95), Inches(0.12))
        hdr.fill.solid()
        hdr.fill.fore_color.rgb = color
        hdr.line.fill.background()
        num = s.shapes.add_textbox(left + Inches(0.3), Inches(2.1), Inches(3.3), Inches(0.4))
        set_text(num, f"0{i+1}", 22, True, color)
        t = s.shapes.add_textbox(left + Inches(0.3), Inches(2.7), Inches(3.3), Inches(0.5))
        set_text(t, title, 16, True, NAVY)
        b = s.shapes.add_textbox(left + Inches(0.3), Inches(3.4), Inches(3.3), Inches(2.0))
        set_text(b, body, 13, False, MUTED)

    footer(s, "Executive Summary", 2)
    notes(
        s,
        "Spend 60–90 seconds. Do not list features. "
        "Challenge → Opportunity → Outcome is the entire narrative of the briefing.",
    )
    fade_transition(s)


def s03_what_is(prs):
    s = blank(prs)
    top_bar(s)
    eyebrow(s, "02  ·  What is CENTRIX?")
    heading(s, "The enterprise system of record for IT assets & access")
    key_msg(s, "Key message: CENTRIX centralizes the IT ecosystem — applications to audit evidence.")

    # hub
    hub = card(s, Inches(5.0), Inches(3.15), Inches(3.3), Inches(1.5), ROYAL, ROYAL)
    set_text(hub, "CENTRIX\nGovernance Core", 14, True, WHITE, PP_ALIGN.CENTER)

    spokes = [
        (0.55, 1.75, "Applications"),
        (3.55, 1.75, "Licenses"),
        (9.55, 1.75, "Vendors"),
        (11.55, 1.75, "Departments"),
        (0.55, 5.2, "Identity"),
        (3.55, 5.2, "Access"),
        (9.55, 5.2, "Reporting"),
        (11.55, 5.2, "Governance"),
    ]
    for x, y, label in spokes:
        c = card(s, Inches(x), Inches(y), Inches(2.2), Inches(0.95), LIGHT)
        set_text(c, label, 12, True, NAVY, PP_ALIGN.CENTER)

    footer(s, "What is CENTRIX?", 3)
    notes(
        s,
        "Explain CENTRIX as an Enterprise IT Portfolio & Access Governance Platform. "
        "Use the hub diagram: one core, eight governed domains. Avoid UI walkthrough.",
    )
    fade_transition(s)


def s04_purpose(prs):
    s = blank(prs)
    top_bar(s)
    eyebrow(s, "03  ·  Purpose")
    heading(s, "Why CENTRIX exists")
    key_msg(s, "Key message: Purpose is governance outcomes — not software features.")

    items = [
        ("01", "Single Source of Truth", AZURE),
        ("02", "Application Governance", ROYAL),
        ("03", "License Governance", TEAL),
        ("04", "Access Governance", CYAN),
        ("05", "Executive Visibility", FOREST),
        ("06", "Operational Excellence", SAGE),
        ("07", "Risk Reduction", CORAL),
        ("08", "Cost Optimization", GOLD),
        ("09", "Compliance Assurance", PURPLE),
    ]
    for i, (num, title, color) in enumerate(items):
        row, col = divmod(i, 3)
        left = Inches(0.55 + col * 4.15)
        top = Inches(1.65 + row * 1.65)
        c = card(s, left, top, Inches(3.95), Inches(1.45))
        accent_strip(s, left, top, Inches(1.45), color)
        n = s.shapes.add_textbox(left + Inches(0.25), top + Inches(0.25), Inches(0.6), Inches(0.35))
        set_text(n, num, 12, True, color)
        t = s.shapes.add_textbox(left + Inches(0.25), top + Inches(0.7), Inches(3.4), Inches(0.5))
        set_text(t, title, 15, True, NAVY)

    footer(s, "Purpose", 4)
    notes(s, "Read three purposes aloud that match the room (often: single source of truth, cost, compliance).")
    fade_transition(s)


def s05_challenges(prs):
    s = blank(prs)
    top_bar(s, CORAL)
    eyebrow(s, "04  ·  Current Challenges")
    heading(s, "The cost of fragmentation")
    key_msg(s, "Key message: Today’s model relies on files, inboxes, and tribal knowledge.")

    problems = [
        ("Sheets", "Disconnected\nspreadsheets"),
        ("Owner?", "Unknown\nownership"),
        ("Manual", "Manual license\ntracking"),
        ("No hub", "No centralized\ninventory"),
        ("Blind", "Limited\nvisibility"),
        ("Risk", "Security\nrisks"),
        ("Gaps", "Compliance\ngaps"),
        ("Dupes", "Duplicate\nsystems"),
    ]
    for i, (icon, label) in enumerate(problems):
        row, col = divmod(i, 4)
        left = Inches(0.55 + col * 3.15)
        top = Inches(1.7 + row * 2.45)
        c = card(s, left, top, Inches(3.0), Inches(2.2), LIGHT)
        icon_badge(s, left + Inches(1.05), top + Inches(0.3), Inches(0.9), icon[:1], CORAL if i % 2 else ROYAL)
        t = s.shapes.add_textbox(left + Inches(0.2), top + Inches(1.35), Inches(2.6), Inches(0.7))
        set_text(t, label, 12, True, NAVY, PP_ALIGN.CENTER)

    footer(s, "Current Challenges", 5)
    notes(
        s,
        "Ask: can leadership produce an authoritative list of production applications, "
        "owners, and licenses expiring this quarter in under one hour?",
    )
    fade_transition(s)


def s06_impact(prs):
    s = blank(prs)
    top_bar(s, CORAL)
    eyebrow(s, "05  ·  Business Impact")
    heading(s, "How fragmentation hits the enterprise")
    key_msg(s, "Key message: This is a risk, cost, and decision-quality problem.")

    impacts = [
        (CORAL, "Operations", "Fire drills, rework,\nknowledge loss"),
        (ROYAL, "Security", "Access drift,\nunclear entitlements"),
        (PURPLE, "Compliance", "Weak evidence,\nslow audits"),
        (GOLD, "Cost", "Shelfware,\nsurprise renewals"),
        (AZURE, "Decisions", "Conflicting data,\ndelayed choices"),
    ]
    for i, (color, title, body) in enumerate(impacts):
        left = Inches(0.45 + i * 2.55)
        c = card(s, left, Inches(1.85), Inches(2.4), Inches(4.4))
        bar = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, Inches(1.85), Inches(2.4), Inches(0.14))
        bar.fill.solid()
        bar.fill.fore_color.rgb = color
        bar.line.fill.background()
        icon_badge(s, left + Inches(0.75), Inches(2.3), Inches(0.9), title[:1], color)
        t = s.shapes.add_textbox(left + Inches(0.15), Inches(3.45), Inches(2.1), Inches(0.45))
        set_text(t, title, 14, True, NAVY, PP_ALIGN.CENTER)
        b = s.shapes.add_textbox(left + Inches(0.15), Inches(4.1), Inches(2.1), Inches(1.4))
        set_text(b, body, 12, False, MUTED, PP_ALIGN.CENTER)

    footer(s, "Business Impact", 6)
    notes(s, "Keep sober. One real organizational anecdote is enough if available.")
    fade_transition(s)


def s07_portal(prs):
    s = blank(prs)
    top_bar(s)
    eyebrow(s, "06  ·  Portal Overview")
    heading(s, "One governed journey across the IT estate")
    key_msg(s, "Key message: CENTRIX connects inventory → control → assurance → insight.")

    steps = [
        "Applications",
        "Licenses",
        "Departments",
        "Users",
        "Roles",
        "Identity Providers",
        "Audit Logs",
        "Reports",
    ]
    colors = [ROYAL, AZURE, TEAL, CYAN, FOREST, PURPLE, CORAL, GOLD]
    for i, (label, color) in enumerate(zip(steps, colors)):
        row = i // 4
        col = i % 4
        left = Inches(0.55 + col * 3.15)
        top = Inches(1.8 + row * 2.4)
        c = card(s, left, top, Inches(3.0), Inches(1.9))
        n = s.shapes.add_textbox(left + Inches(0.2), top + Inches(0.35), Inches(2.6), Inches(0.35))
        set_text(n, f"{i+1:02d}", 14, True, color)
        t = s.shapes.add_textbox(left + Inches(0.2), top + Inches(0.85), Inches(2.6), Inches(0.7))
        set_text(t, label, 14, True, NAVY)
        if i < 7 and col < 3:
            arr = s.shapes.add_textbox(left + Inches(2.85), top + Inches(0.75), Inches(0.35), Inches(0.4))
            set_text(arr, "→", 16, True, AZURE)

    footer(s, "Portal Overview", 7)
    notes(s, "This is the conceptual map — not a click path. Demo flow comes later.")
    fade_transition(s)


def s08_dashboard(prs):
    s = blank(prs)
    top_bar(s)
    eyebrow(s, "07  ·  Dashboard Overview")
    heading(s, "Executive visibility at a glance", 0.48, 26)
    key_msg(s, "Key message: Leadership questions answered without assembling a deck.", 0.95)

    # KPI strip
    kpis = [
        ("128", "Applications", AZURE),
        ("64", "Licenses", TEAL),
        ("18", "Vendors", ROYAL),
        ("24", "Departments", FOREST),
        ("860", "Users", CYAN),
        ("3", "IdP / SSO", PURPLE),
        ("4.2k", "Audit Events", CORAL),
    ]
    for i, (val, label, color) in enumerate(kpis):
        kpi(s, Inches(0.4 + i * 1.85), Inches(1.4), Inches(1.75), Inches(1.15), val, label, color)

    # laptop mockup
    laptop_placeholder(s, Inches(0.55), Inches(2.8), Inches(7.6), Inches(3.9), "Dashboard")

    # side mini charts
    t1 = s.shapes.add_textbox(Inches(8.5), Inches(2.75), Inches(4.3), Inches(0.3))
    set_text(t1, "License Status", 11, True, MUTED)
    add_donut(s, Inches(8.4), Inches(3.0), Inches(4.4), Inches(2.0), ["Active", "Expiring", "Expired"], [0.72, 0.18, 0.10])

    t2 = s.shapes.add_textbox(Inches(8.5), Inches(5.05), Inches(4.3), Inches(0.3))
    set_text(t2, "Apps by Environment", 11, True, MUTED)
    add_stacked(
        s,
        Inches(8.4),
        Inches(5.25),
        Inches(4.4),
        Inches(1.5),
        ["Prod", "Non-Prod", "DR"],
        {"Business Apps": [48, 22, 8], "Platform Tools": [18, 14, 6]},
    )

    footer(s, "Dashboard Overview", 8)
    notes(
        s,
        "KPI values are illustrative executive placeholders until production metrics are locked. "
        "Replace laptop frame with the real dashboard screenshot — layout stays intact.",
    )
    fade_transition(s)


def s09_modules(prs):
    s = blank(prs)
    top_bar(s)
    eyebrow(s, "08  ·  Core Modules")
    heading(s, "Business capabilities — not screens")
    key_msg(s, "Key message: Each module delivers a governance outcome.")

    modules = [
        ("AP", "Applications", "Digital asset inventory & ownership", ROYAL),
        ("LC", "Licenses", "Entitlement, usage & renewals", TEAL),
        ("VN", "Vendors", "Third-party criticality & partners", AZURE),
        ("DP", "Departments", "Organizational accountability", FOREST),
        ("US", "Users", "Workforce & contractor identity", CYAN),
        ("RL", "Roles", "Access governance & least privilege", PURPLE),
        ("ID", "Identity Providers", "Enterprise authentication / SSO", GOLD),
        ("RP", "Reports", "Executive decision support", SAGE),
        ("AU", "Audit Logs", "Compliance evidence trail", CORAL),
    ]
    for i, (badge, title, desc, color) in enumerate(modules):
        row, col = divmod(i, 3)
        left = Inches(0.55 + col * 4.15)
        top = Inches(1.6 + row * 1.7)
        c = card(s, left, top, Inches(3.95), Inches(1.5))
        icon_badge(s, left + Inches(0.25), top + Inches(0.35), Inches(0.7), badge, color)
        t = s.shapes.add_textbox(left + Inches(1.15), top + Inches(0.3), Inches(2.5), Inches(0.4))
        set_text(t, title, 14, True, NAVY)
        d = s.shapes.add_textbox(left + Inches(1.15), top + Inches(0.8), Inches(2.5), Inches(0.5))
        set_text(d, desc, 11, False, MUTED)

    footer(s, "Core Modules", 9)
    notes(s, "Translate each card to value: Licenses = cost control; Audit = audit readiness.")
    fade_transition(s)


def s10_personas(prs):
    s = blank(prs)
    top_bar(s)
    eyebrow(s, "09  ·  Who Can Benefit?")
    heading(s, "Value by stakeholder", 0.48, 26)
    key_msg(s, "Key message: CENTRIX serves the full IT value chain — from ops to the board.", 0.95)

    personas = [
        ("Infrastructure", "Pain: undocumented deps", "Gain: estate clarity"),
        ("Service Desk", "Pain: ownership unknown", "Gain: faster routing"),
        ("Cybersecurity", "Pain: access drift", "Gain: least privilege"),
        ("IT Operations", "Pain: manual tracking", "Gain: one inventory"),
        ("IT Management", "Pain: slow reports", "Gain: live KPIs"),
        ("Enterprise Arch.", "Pain: duplicate systems", "Gain: portfolio view"),
        ("App Owners", "Pain: unclear accountability", "Gain: named ownership"),
        ("Procurement", "Pain: renewal surprises", "Gain: license foresight"),
        ("Compliance", "Pain: weak evidence", "Gain: audit trail"),
        ("Internal Audit", "Pain: reconstruction", "Gain: retrieval"),
        ("Executive Mgmt", "Pain: fragmented packs", "Gain: trusted decisions"),
    ]
    # Row layout: 4 + 4 + 3
    positions = []
    for i in range(8):
        row, col = divmod(i, 4)
        positions.append((Inches(0.45 + col * 3.2), Inches(1.45 + row * 1.7), Inches(3.05)))
    for i in range(3):
        positions.append((Inches(0.7 + i * 4.1), Inches(1.45 + 2 * 1.7), Inches(3.9)))

    for (role, pain, gain), (left, top, width) in zip(personas, positions):
        c = card(s, left, top, width, Inches(1.5))
        t = s.shapes.add_textbox(left + Inches(0.2), top + Inches(0.15), width - Inches(0.35), Inches(0.35))
        set_text(t, role, 12, True, ROYAL)
        p = s.shapes.add_textbox(left + Inches(0.2), top + Inches(0.55), width - Inches(0.35), Inches(0.35))
        set_text(p, pain, 10, False, CORAL)
        g = s.shapes.add_textbox(left + Inches(0.2), top + Inches(0.95), width - Inches(0.35), Inches(0.35))
        set_text(g, gain, 10, False, FOREST)

    footer(s, "Who Can Benefit?", 10)
    notes(s, "Highlight 3–4 personas present in the room. Pain → Gain in one breath each.")
    fade_transition(s)


def s11_security(prs):
    s = blank(prs)
    top_bar(s, ROYAL)
    eyebrow(s, "10  ·  Security & Governance")
    heading(s, "Control by design")
    key_msg(s, "Key message: The governance platform is itself governed.")

    items = [
        ("RBAC", "Role-based access control"),
        ("SSO", "Single sign-on"),
        ("FED", "Identity federation"),
        ("MAP", "Role mapping"),
        ("AUD", "Audit logs"),
        ("ACT", "Activity tracking"),
        ("MIN", "Least privilege"),
        ("AUTH", "Authentication modes"),
        ("APR", "Approval-ready architecture"),
    ]
    colors = [ROYAL, AZURE, TEAL, CYAN, FOREST, PURPLE, GOLD, CORAL, SAGE]
    for i, ((code, label), color) in enumerate(zip(items, colors)):
        row, col = divmod(i, 3)
        left = Inches(0.55 + col * 4.15)
        top = Inches(1.65 + row * 1.7)
        c = card(s, left, top, Inches(3.95), Inches(1.5))
        icon_badge(s, left + Inches(0.3), top + Inches(0.35), Inches(0.75), code[:2], color)
        t = s.shapes.add_textbox(left + Inches(1.25), top + Inches(0.35), Inches(2.4), Inches(0.4))
        set_text(t, code, 13, True, NAVY)
        d = s.shapes.add_textbox(left + Inches(1.25), top + Inches(0.85), Inches(2.4), Inches(0.4))
        set_text(d, label, 12, False, MUTED)

    footer(s, "Security & Governance", 11)
    notes(s, "Reassure CISOs: RBAC, SSO, federation, audit — without protocol deep-dives unless asked.")
    fade_transition(s)


def s12_value(prs):
    s = blank(prs)
    top_bar(s, FOREST)
    eyebrow(s, "11  ·  Business Value")
    heading(s, "Outcomes that matter to leadership")
    key_msg(s, "Key message: Value is measured in time, risk, cost, and decision quality.")

    # left outcomes
    outcomes = [
        ("Reduced Manual Work", AZURE),
        ("Better Compliance", FOREST),
        ("Improved Visibility", ROYAL),
        ("Lower Operational Risk", CORAL),
        ("Faster Audits", TEAL),
        ("License Cost Optimization", GOLD),
        ("Better Decision Making", PURPLE),
    ]
    for i, (title, color) in enumerate(outcomes):
        top = Inches(1.55 + i * 0.7)
        c = card(s, Inches(0.55), top, Inches(6.2), Inches(0.6))
        accent_strip(s, Inches(0.55), top, Inches(0.6), color)
        t = s.shapes.add_textbox(Inches(0.85), top + Inches(0.12), Inches(5.6), Inches(0.4))
        set_text(t, title, 14, True, NAVY)

    # right charts
    t1 = s.shapes.add_textbox(Inches(7.2), Inches(1.5), Inches(5.5), Inches(0.3))
    set_text(t1, "Applications by Department (illustrative)", 11, True, MUTED)
    add_pie(s, Inches(7.1), Inches(1.8), Inches(5.6), Inches(2.4), ["IT", "Tax", "Customs", "Shared"], [0.42, 0.22, 0.18, 0.18])

    t2 = s.shapes.add_textbox(Inches(7.2), Inches(4.3), Inches(5.5), Inches(0.3))
    set_text(t2, "Application Growth", 11, True, MUTED)
    add_line(s, Inches(7.1), Inches(4.55), Inches(5.6), Inches(2.15), ["2022", "2023", "2024", "2025", "2026"], [45, 62, 78, 98, 128])

    footer(s, "Business Value", 12)
    notes(s, "Offer a 90-day value baseline workshop with Finance and IT: hours, renewals, shelfware.")
    fade_transition(s)


def s13_roadmap(prs):
    s = blank(prs)
    top_bar(s)
    eyebrow(s, "12  ·  Future Roadmap")
    heading(s, "From foundation to intelligence", 0.48, 26)
    key_msg(s, "Key message: Control first — then automation, integration, and AI.", 0.95)

    # timeline line
    line = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.7), Inches(2.55), Inches(12.0), Inches(0.06))
    line.fill.solid()
    line.fill.fore_color.rgb = AZURE
    line.line.fill.background()

    phases = [
        ("1", "Portfolio\nManagement", "Completed", FOREST),
        ("2", "License\nGovernance", "Completed", FOREST),
        ("3", "Identity &\nAccess", "Completed", FOREST),
        ("4", "Workflow\nAutomation", "Future", AZURE),
        ("5", "CMDB\nIntegration", "Future", AZURE),
        ("6", "ServiceNow\nIntegration", "Future", AZURE),
        ("7", "AI\nInsights", "Future", PURPLE),
        ("8", "Predictive\nAnalytics", "Future", PURPLE),
        ("9", "Mobile\nApplication", "Future", GOLD),
    ]
    for i, (num, title, status, color) in enumerate(phases):
        left = Inches(0.45 + i * 1.4)
        # dot
        dot = s.shapes.add_shape(MSO_SHAPE.OVAL, left + Inches(0.4), Inches(2.4), Inches(0.35), Inches(0.35))
        dot.fill.solid()
        dot.fill.fore_color.rgb = color
        dot.line.fill.background()
        # card below / above alternate
        top = Inches(3.0) if i % 2 == 0 else Inches(4.85)
        c = card(s, left, top, Inches(1.35), Inches(1.55))
        n = s.shapes.add_textbox(left + Inches(0.08), top + Inches(0.1), Inches(1.2), Inches(0.25))
        set_text(n, f"P{num}", 10, True, color, PP_ALIGN.CENTER)
        t = s.shapes.add_textbox(left + Inches(0.05), top + Inches(0.4), Inches(1.25), Inches(0.7))
        set_text(t, title, 9, True, NAVY, PP_ALIGN.CENTER)
        st = s.shapes.add_textbox(left + Inches(0.05), top + Inches(1.15), Inches(1.25), Inches(0.3))
        set_text(st, status, 9, False, FOREST if status == "Completed" else MUTED, PP_ALIGN.CENTER)

    footer(s, "Future Roadmap", 13)
    notes(s, "Do not over-promise dates. Emphasize completed foundation and sequenced future value.")
    fade_transition(s)


def s14_vision(prs):
    s = blank(prs)
    top_bar(s, CYAN)
    eyebrow(s, "13  ·  Vision")
    heading(s, "Where CENTRIX is heading")
    key_msg(s, "Key message: One trusted platform for the complete IT ecosystem.")

    # vision quote card
    q = card(s, Inches(0.55), Inches(1.6), Inches(12.2), Inches(1.6), ROYAL, ROYAL)
    set_text(
        q,
        "“To become the single trusted platform for managing\nthe complete IT ecosystem across the organization.”",
        18,
        True,
        WHITE,
        PP_ALIGN.CENTER,
    )

    pillars = [
        ("People", AZURE),
        ("Processes", TEAL),
        ("Technology", ROYAL),
        ("Governance", FOREST),
        ("Automation", CYAN),
        ("AI", PURPLE),
        ("Analytics", GOLD),
        ("Compliance", CORAL),
    ]
    for i, (title, color) in enumerate(pillars):
        left = Inches(0.55 + i * 1.55)
        c = card(s, left, Inches(3.7), Inches(1.45), Inches(2.5))
        icon_badge(s, left + Inches(0.35), Inches(4.0), Inches(0.75), title[:1], color)
        t = s.shapes.add_textbox(left + Inches(0.05), Inches(5.0), Inches(1.35), Inches(0.7))
        set_text(t, title, 11, True, NAVY, PP_ALIGN.CENTER)

    footer(s, "Vision", 14)
    notes(s, "Pause after the vision statement. Let the room absorb it before pillars.")
    fade_transition(s)


def s15_demo(prs):
    s = blank(prs)
    top_bar(s)
    eyebrow(s, "14  ·  Live Demonstration")
    heading(s, "A business story — not a menu walk")
    key_msg(s, "Key message: See → Own → Control → Govern → Prove.")

    steps = [
        "Dashboard",
        "Applications",
        "Licenses",
        "Departments",
        "Users",
        "Roles",
        "Identity Providers",
        "Audit Logs",
        "Reports",
    ]
    for i, step in enumerate(steps):
        left = Inches(0.45 + (i % 5) * 2.55)
        top = Inches(1.8) if i < 5 else Inches(3.6)
        if i >= 5:
            left = Inches(0.45 + (i - 5) * 2.55 + 1.25)
        c = card(s, left, top, Inches(2.4), Inches(1.35), ROYAL if i == 0 else WHITE)
        n = s.shapes.add_textbox(left + Inches(0.15), top + Inches(0.25), Inches(2.1), Inches(0.3))
        set_text(n, f"{i+1:02d}", 11, True, CYAN if i == 0 else AZURE)
        t = s.shapes.add_textbox(left + Inches(0.15), top + Inches(0.65), Inches(2.1), Inches(0.45))
        set_text(t, step, 13, True, WHITE if i == 0 else NAVY)

    tip = card(s, Inches(0.55), Inches(5.4), Inches(12.2), Inches(1.2), LIGHT)
    set_text(
        tip,
        "Facilitation  ·  12–15 minutes  ·  One executive question mid-demo  ·  End on Reports / Dashboard\n"
        "Replace later with live system — flow stays identical.",
        13,
        False,
        SLATE,
        PP_ALIGN.CENTER,
    )

    footer(s, "Live Demonstration", 15)
    notes(s, "Restate the flow once, then switch to the live environment. Capture questions separately.")
    fade_transition(s)


def s16_close(prs):
    s = blank(prs)
    bg = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), SW, SH)
    bg.fill.solid()
    bg.fill.fore_color.rgb = NAVY
    bg.line.fill.background()
    rail = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(0.18), SH)
    rail.fill.solid()
    rail.fill.fore_color.rgb = CYAN
    rail.line.fill.background()

    eye = s.shapes.add_textbox(Inches(0.9), Inches(2.4), Inches(11), Inches(0.4))
    set_text(eye, "THANK YOU", 14, True, CYAN)
    h = s.shapes.add_textbox(Inches(0.9), Inches(3.0), Inches(11.5), Inches(0.8))
    set_text(h, "Questions", 44, True, WHITE)
    sub = s.shapes.add_textbox(Inches(0.9), Inches(4.0), Inches(11), Inches(0.5))
    set_text(sub, "CENTRIX  ·  Enterprise IT Portfolio & Access Governance", 16, False, AZURE)
    meta = s.shapes.add_textbox(Inches(0.9), Inches(5.5), Inches(11), Inches(0.4))
    set_text(meta, "We welcome your guidance, sponsorship, and questions.", 13, False, RGBColor(0x9A, 0xAA, 0xBA))

    notes(
        s,
        "Close with the ask if not already stated: endorse CENTRIX as system of record, "
        "name owners, approve 90-day value plan. Remain for Q&A.",
    )
    fade_transition(s)


def s_placeholders_appendix(prs):
    """Extra slide bank of labeled placeholders for later screenshot replacement."""
    # Not in the 16 — user asked placeholders on relevant slides; dashboard has laptop.
    # Add a dedicated assets slide as slide after? User asked exactly 16 structure.
    # Instead embed small placeholders on a hidden approach — skip extra slide.
    pass


def build():
    prs = Presentation()
    prs.slide_width = SW
    prs.slide_height = SH

    builders = [
        s01_title,
        s02_exec_summary,
        s03_what_is,
        s04_purpose,
        s05_challenges,
        s06_impact,
        s07_portal,
        s08_dashboard,
        s09_modules,
        s10_personas,
        s11_security,
        s12_value,
        s13_roadmap,
        s14_vision,
        s15_demo,
        s16_close,
    ]
    assert len(builders) == TOTAL

    for fn in builders:
        fn(prs)

    # Add a final "Screenshot Kit" slide for the required placeholders (slide 17)
    # User asked 16 content slides; kit helps replacement — include as appendix slide 17.
    s = blank(prs)
    top_bar(s)
    eyebrow(s, "Appendix  ·  Screenshot Replacement Kit")
    heading(s, "Drop-in media slots (correct aspect)", 0.48, 24)
    key_msg(s, "Replace each labeled frame with the matching CENTRIX screenshot — layout preserved.", 0.95)

    shots = [
        ("Dashboard", 0.4, 1.45),
        ("Applications", 3.5, 1.45),
        ("Licenses", 6.6, 1.45),
        ("Vendors", 9.7, 1.45),
        ("Departments", 0.4, 3.35),
        ("Users", 3.5, 3.35),
        ("Roles & Permissions", 6.6, 3.35),
        ("Identity Providers (SSO)", 9.7, 3.35),
        ("Audit Logs", 2.0, 5.25),
        ("Reports", 6.6, 5.25),
    ]
    for label, x, y in shots:
        placeholder(s, Inches(x), Inches(y), Inches(2.95), Inches(1.7), label, "16:9 slot")

    footer(s, "Screenshot Kit", 17)
    notes(s, "Appendix for design ops. Not required in the spoken executive narrative.")
    fade_transition(s)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    prs.save(str(OUT))
    print(f"Wrote {OUT} ({len(prs.slides)} slides)")
    return OUT


if __name__ == "__main__":
    build()
