#!/usr/bin/env python3
"""
Rebuild CENTRIX.pptx so content fits style.pptx design chrome.

Design rules from style layouts:
- White/Grey ARA: title in slot (2.06, 0.47) next to logo; body from y≈1.15
- Avoid crowding bottom-left motif (0–4.6in x, 3.56–7.5in)
- Cover: copy on the right clear zone
- Divider: section title sits in the teal band (≈2.88, 3.18)
- Footer 'Public | عام' comes from master — do not replace
- Fonts: Aptos Display / Aptos
- Accents from theme + divider teal #34A0A4
"""

from __future__ import annotations

import shutil
from pathlib import Path

from lxml import etree
from pptx import Presentation
from pptx.chart.data import CategoryChartData
from pptx.dml.color import RGBColor
from pptx.enum.chart import XL_CHART_TYPE, XL_LEGEND_POSITION
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Inches, Pt

BASE = Path(r"c:\Users\mosmo\OneDrive\Desktop\it-portfolio-system\docs\executive-presentation")
STYLE = BASE / "style.pptx"
OUT = BASE / "CENTRIX.pptx"
BACKUP = BASE / "CENTRIX.prev.pptx"

# Style / ZATCA palette
NAVY = RGBColor(0x0E, 0x28, 0x41)
TEAL = RGBColor(0x34, 0xA0, 0xA4)      # divider brand teal
ACCENT1 = RGBColor(0x15, 0x60, 0x82)
ACCENT2 = RGBColor(0xE9, 0x71, 0x32)
ACCENT3 = RGBColor(0x19, 0x6B, 0x24)
ACCENT4 = RGBColor(0x0F, 0x9E, 0xD5)
ACCENT5 = RGBColor(0xA0, 0x2B, 0x93)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
LIGHT = RGBColor(0xF2, 0xF2, 0xF2)
MUTED = RGBColor(0x5B, 0x6B, 0x7A)
LINE = RGBColor(0xD0, 0xD7, 0xDE)

FONT_T = "Aptos Display"
FONT_B = "Aptos"

# Content geometry matching White/Grey ARA layouts
TITLE_X, TITLE_Y, TITLE_W, TITLE_H = 2.06, 0.47, 10.90, 0.49
BODY_X = 1.20
BODY_Y = 1.20
BODY_R = 12.70
BODY_BOTTOM = 6.70
SAFE_LEFT_BOTTOM = 4.80  # keep important cards clear of corner motif


def run(r, text, size, bold=False, color=NAVY, font=FONT_B):
    r.text = text
    r.font.size = Pt(size)
    r.font.bold = bold
    r.font.color.rgb = color
    r.font.name = font


def set_text(shape, text, size, bold=False, color=NAVY, align=PP_ALIGN.LEFT, font=FONT_B, anchor=None):
    tf = shape.text_frame
    tf.clear()
    tf.word_wrap = True
    if anchor is not None:
        try:
            tf.auto_size = None
        except Exception:
            pass
        shape.text_frame.paragraphs[0].alignment = align
    p = tf.paragraphs[0]
    p.alignment = align
    run(p.add_run(), text, size, bold, color, font)
    if anchor is not None:
        try:
            tf._txBody.bodyPr.set("anchor", anchor)
        except Exception:
            pass


def notes(slide, text):
    slide.notes_slide.notes_text_frame.text = text


def fade(slide):
    sld = slide._element
    for child in list(sld):
        if child.tag == qn("p:transition"):
            sld.remove(child)
    tr = etree.SubElement(sld, qn("p:transition"))
    tr.set("spd", "med")
    etree.SubElement(tr, qn("p:fade"))


def delete_all_slides(prs: Presentation) -> None:
    sld_id_lst = prs.slides._sldIdLst
    for sld_id in list(sld_id_lst):
        r_id = sld_id.get(qn("r:id"))
        prs.part.drop_rel(r_id)
        sld_id_lst.remove(sld_id)


def layout(prs: Presentation, name: str):
    for lay in prs.slide_layouts:
        if lay.name == name:
            return lay
    return prs.slide_layouts[6]


def add_slide(prs: Presentation, name: str):
    return prs.slides.add_slide(layout(prs, name))


def set_ara_title(slide, text: str) -> None:
    """Write into the ARA layout title slot (beside logo)."""
    for sh in slide.shapes:
        if getattr(sh, "is_placeholder", False) and sh.width.inches > 8 and sh.top.inches < 1.0:
            set_text(sh, text, 22, True, NAVY, font=FONT_T)
            try:
                sh.text_frame.word_wrap = False
            except Exception:
                pass
            return
    box = slide.shapes.add_textbox(Inches(TITLE_X), Inches(TITLE_Y), Inches(TITLE_W), Inches(TITLE_H))
    set_text(box, text, 22, True, NAVY, font=FONT_T)


def lead(slide, text: str, y: float = BODY_Y) -> float:
    """One-line lead under title. Returns next Y."""
    box = slide.shapes.add_textbox(Inches(BODY_X), Inches(y), Inches(BODY_R - BODY_X), Inches(0.35))
    set_text(box, text, 13, False, MUTED, font=FONT_B)
    return y + 0.45


def accent_line(slide, x, y, w):
    """Brand underline like style freeforms."""
    s = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(0.045))
    s.fill.solid()
    s.fill.fore_color.rgb = TEAL
    s.line.fill.background()
    return s


def card(slide, x, y, w, h, fill=WHITE, line=LINE):
    s = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    s.line.color.rgb = line
    s.line.width = Pt(1)
    try:
        s.adjustments[0] = 0.05
    except Exception:
        pass
    return s


def top_bar(slide, x, y, w, color):
    s = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(0.08))
    s.fill.solid()
    s.fill.fore_color.rgb = color
    s.line.fill.background()
    return s


def side_bar(slide, x, y, h, color):
    s = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(0.08), Inches(h))
    s.fill.solid()
    s.fill.fore_color.rgb = color
    s.line.fill.background()
    return s


def pill(slide, x, y, w, h, text, fill, font_color=WHITE):
    s = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    s.line.fill.background()
    try:
        s.adjustments[0] = 0.5
    except Exception:
        pass
    set_text(s, text, 11, True, font_color, PP_ALIGN.CENTER, FONT_B)
    return s


def placeholder(slide, x, y, w, h, label):
    c = card(slide, x, y, w, h, LIGHT, LINE)
    set_text(c, f"[ {label} Screenshot ]\n16:9 — replace later", 12, True, ACCENT1, PP_ALIGN.CENTER, FONT_B)
    return c


def donut(slide, x, y, w, h, cats, vals):
    data = CategoryChartData()
    data.categories = cats
    data.add_series("Status", vals)
    ch = slide.shapes.add_chart(XL_CHART_TYPE.DOUGHNUT, Inches(x), Inches(y), Inches(w), Inches(h), data).chart
    ch.has_legend = True
    ch.legend.position = XL_LEGEND_POSITION.BOTTOM
    return ch


def pie(slide, x, y, w, h, cats, vals):
    data = CategoryChartData()
    data.categories = cats
    data.add_series("Share", vals)
    ch = slide.shapes.add_chart(XL_CHART_TYPE.PIE, Inches(x), Inches(y), Inches(w), Inches(h), data).chart
    ch.has_legend = True
    ch.legend.position = XL_LEGEND_POSITION.BOTTOM
    return ch


def line_chart(slide, x, y, w, h, cats, vals):
    data = CategoryChartData()
    data.categories = cats
    data.add_series("Applications", vals)
    ch = slide.shapes.add_chart(XL_CHART_TYPE.LINE_MARKERS, Inches(x), Inches(y), Inches(w), Inches(h), data).chart
    ch.has_legend = False
    return ch


def stacked(slide, x, y, w, h, cats, series):
    data = CategoryChartData()
    data.categories = cats
    for n, v in series.items():
        data.add_series(n, v)
    ch = slide.shapes.add_chart(XL_CHART_TYPE.COLUMN_STACKED, Inches(x), Inches(y), Inches(w), Inches(h), data).chart
    ch.has_legend = True
    ch.legend.position = XL_LEGEND_POSITION.BOTTOM
    return ch


# ─── Slides ─────────────────────────────────────────────────────────────────

def s01(prs):
    s = add_slide(prs, "Cover 20 ARA")
    # Right clear zone — aligned under ZATCA wordmark area
    eye = s.shapes.add_textbox(Inches(5.4), Inches(2.15), Inches(7.2), Inches(0.3))
    set_text(eye, "ENTERPRISE IT GOVERNANCE", 11, True, TEAL, font=FONT_B)
    accent_line(s, 5.4, 2.5, 2.4)
    brand = s.shapes.add_textbox(Inches(5.4), Inches(2.7), Inches(7.2), Inches(0.85))
    set_text(brand, "CENTRIX", 48, True, WHITE, font=FONT_T)
    sub = s.shapes.add_textbox(Inches(5.4), Inches(3.6), Inches(7.2), Inches(0.55))
    set_text(sub, "Enterprise IT Portfolio & Access Governance Platform", 16, False, ACCENT4, font=FONT_B)
    tag = s.shapes.add_textbox(Inches(5.4), Inches(4.35), Inches(7.0), Inches(0.7))
    set_text(tag, "Transforming IT Governance Through\nCentralization, Automation and Visibility", 14, False, RGBColor(0xC5, 0xD0, 0xDA), font=FONT_B)
    meta = s.shapes.add_textbox(Inches(5.4), Inches(5.5), Inches(7.0), Inches(0.35))
    set_text(meta, "Executive Briefing  ·  Senior Management", 12, False, RGBColor(0x9A, 0xAA, 0xBA), font=FONT_B)
    notes(s, "Open as governance vision — not a product tour.")
    fade(s)


def s02(prs):
    s = add_slide(prs, "White ARA BG")
    set_ara_title(s, "Executive Summary")
    y = lead(s, "One platform. One truth. Better control.")
    accent_line(s, BODY_X, y - 0.08, 1.8)

    cols = [
        (ACCENT2, "01", "Current Challenges", "Spreadsheets · unknown ownership\nManual licenses · weak evidence"),
        (ACCENT4, "02", "Business Opportunity", "Centralize portfolio, licenses,\nidentity and executive visibility"),
        (ACCENT3, "03", "Expected Outcome", "Lower risk · lower waste\nFaster audits · clearer decisions"),
    ]
    top = 1.85
    for i, (color, num, head, body) in enumerate(cols):
        x = BODY_X + i * 3.85
        c = card(s, x, top, 3.65, 4.4)
        top_bar(s, x, top, 3.65, color)
        n = s.shapes.add_textbox(Inches(x + 0.25), Inches(top + 0.4), Inches(3.1), Inches(0.4))
        set_text(n, num, 22, True, color, font=FONT_T)
        t = s.shapes.add_textbox(Inches(x + 0.25), Inches(top + 1.05), Inches(3.1), Inches(0.55))
        set_text(t, head, 16, True, NAVY, font=FONT_T)
        b = s.shapes.add_textbox(Inches(x + 0.25), Inches(top + 1.8), Inches(3.1), Inches(2.0))
        set_text(b, body, 13, False, MUTED, font=FONT_B)
    notes(s, "Challenge → Opportunity → Outcome in under 90 seconds.")
    fade(s)


def s03(prs):
    s = add_slide(prs, "White ARA BG")
    set_ara_title(s, "What is CENTRIX?")
    y = lead(s, "A centralized enterprise platform for the IT application portfolio.")
    accent_line(s, BODY_X, y - 0.08, 1.8)

    hub = card(s, 5.0, 3.35, 3.3, 1.35, NAVY, NAVY)
    set_text(hub, "CENTRIX\nGovernance Core", 14, True, WHITE, PP_ALIGN.CENTER, FONT_T)

    spokes = [
        (1.3, 1.9, "Applications"), (3.7, 1.9, "Licenses"),
        (8.3, 1.9, "Vendors"), (10.7, 1.9, "Departments"),
        (1.3, 5.2, "Identity"), (3.7, 5.2, "Access"),
        (8.3, 5.2, "Reporting"), (10.7, 5.2, "Governance"),
    ]
    for x, yy, label in spokes:
        c = card(s, x, yy, 2.2, 0.95, LIGHT)
        set_text(c, label, 13, True, NAVY, PP_ALIGN.CENTER, FONT_B)
    notes(s, "One core, eight governed domains — avoid UI walkthrough.")
    fade(s)


def s04(prs):
    s = add_slide(prs, "White ARA BG")
    set_ara_title(s, "Purpose")
    y = lead(s, "Why CENTRIX exists - governance outcomes, not features.")
    accent_line(s, BODY_X, y - 0.08, 1.8)

    items = [
        ("01", "Single Source of Truth", ACCENT4),
        ("02", "Application Governance", ACCENT1),
        ("03", "License Governance", TEAL),
        ("04", "Access Governance", ACCENT4),
        ("05", "Executive Visibility", ACCENT3),
        ("06", "Operational Excellence", ACCENT1),
        ("07", "Risk Reduction", ACCENT2),
        ("08", "Cost Optimization", ACCENT2),
        ("09", "Compliance Assurance", ACCENT5),
    ]
    for i, (num, label, color) in enumerate(items):
        row, col = divmod(i, 3)
        x = BODY_X + col * 3.85
        yy = 1.8 + row * 1.55
        c = card(s, x, yy, 3.65, 1.35)
        side_bar(s, x, yy, 1.35, color)
        n = s.shapes.add_textbox(Inches(x + 0.3), Inches(yy + 0.2), Inches(0.55), Inches(0.3))
        set_text(n, num, 12, True, color, font=FONT_B)
        t = s.shapes.add_textbox(Inches(x + 0.3), Inches(yy + 0.65), Inches(3.1), Inches(0.45))
        set_text(t, label, 14, True, NAVY, font=FONT_T)
    notes(s, "Call out three purposes that match the audience.")
    fade(s)


def s05(prs):
    s = add_slide(prs, "Grey ARA BG")
    set_ara_title(s, "Current Challenges")
    y = lead(s, "Fragmentation creates avoidable operational and compliance risk.")
    accent_line(s, BODY_X, y - 0.08, 1.8)

    # Top row only across full width; bottom row starts at SAFE_LEFT_BOTTOM
    problems = [
        "Disconnected spreadsheets",
        "Unknown ownership",
        "Manual license tracking",
        "No centralized inventory",
        "Limited visibility",
        "Security risks",
        "Compliance gaps",
        "Duplicate systems",
    ]
    colors = [ACCENT2, ACCENT1, ACCENT4, ACCENT5, ACCENT2, ACCENT1, ACCENT3, TEAL]
    # 4 on top row (y=1.8), 4 on bottom but shifted right to clear motif
    for i, (label, color) in enumerate(zip(problems, colors)):
        if i < 4:
            x = BODY_X + i * 2.9
            yy = 1.85
        else:
            x = SAFE_LEFT_BOTTOM + (i - 4) * 1.95
            yy = 4.15
            # tighten: 4 cards from 4.8 to 12.7 => width ~1.9
        w = 2.75 if i < 4 else 1.85
        c = card(s, x, yy, w, 2.0 if i < 4 else 2.15, WHITE)
        top_bar(s, x, yy, w, color)
        n = s.shapes.add_textbox(Inches(x + 0.15), Inches(yy + 0.35), Inches(w - 0.3), Inches(0.35))
        set_text(n, f"{i+1:02d}", 16, True, color, PP_ALIGN.CENTER, FONT_T)
        t = s.shapes.add_textbox(Inches(x + 0.1), Inches(yy + 0.95), Inches(w - 0.2), Inches(0.85))
        set_text(t, label, 12, True, NAVY, PP_ALIGN.CENTER, FONT_B)
    notes(s, "Ask if an authoritative inventory can be produced in under one hour.")
    fade(s)


def s06(prs):
    s = add_slide(prs, "White ARA BG")
    set_ara_title(s, "Business Impact")
    y = lead(s, "Fragmentation is a risk, cost, and decision-quality problem.")
    accent_line(s, BODY_X, y - 0.08, 1.8)

    impacts = [
        (ACCENT2, "Operations", "Fire drills\nRework\nKnowledge loss"),
        (ACCENT1, "Security", "Access drift\nUnclear rights"),
        (ACCENT5, "Compliance", "Weak evidence\nSlow audits"),
        (ACCENT2, "Cost", "Shelfware\nLate renewals"),
        (ACCENT4, "Decisions", "Conflicting data\nDelayed choices"),
    ]
    for i, (color, head, body) in enumerate(impacts):
        x = BODY_X + i * 2.3
        c = card(s, x, 1.85, 2.15, 4.35)
        top_bar(s, x, 1.85, 2.15, color)
        t = s.shapes.add_textbox(Inches(x + 0.12), Inches(2.3), Inches(1.9), Inches(0.5))
        set_text(t, head, 14, True, NAVY, PP_ALIGN.CENTER, FONT_T)
        b = s.shapes.add_textbox(Inches(x + 0.12), Inches(3.2), Inches(1.9), Inches(2.4))
        set_text(b, body, 13, False, MUTED, PP_ALIGN.CENTER, FONT_B)
    notes(s, "Keep sober — one real anecdote is enough.")
    fade(s)


def s07(prs):
    s = add_slide(prs, "White ARA BG")
    set_ara_title(s, "Portal Overview")
    y = lead(s, "One governed journey: inventory → control → assurance → insight.")
    accent_line(s, BODY_X, y - 0.08, 1.8)

    steps = [
        ("01", "Applications"), ("02", "Licenses"), ("03", "Departments"), ("04", "Users"),
        ("05", "Roles"), ("06", "Identity Providers"), ("07", "Audit Logs"), ("08", "Reports"),
    ]
    for i, (num, label) in enumerate(steps):
        row, col = divmod(i, 4)
        x = BODY_X + col * 2.9
        yy = 1.85 + row * 2.25
        c = card(s, x, yy, 2.75, 2.0)
        n = s.shapes.add_textbox(Inches(x + 0.2), Inches(yy + 0.35), Inches(2.35), Inches(0.35))
        set_text(n, num, 14, True, TEAL, font=FONT_T)
        t = s.shapes.add_textbox(Inches(x + 0.2), Inches(yy + 0.9), Inches(2.35), Inches(0.7))
        set_text(t, label, 14, True, NAVY, font=FONT_T)
        if col < 3:
            a = s.shapes.add_textbox(Inches(x + 2.55), Inches(yy + 0.8), Inches(0.35), Inches(0.35))
            set_text(a, "→", 14, True, ACCENT4, PP_ALIGN.CENTER)
    notes(s, "Conceptual map only — not a click path.")
    fade(s)


def s08(prs):
    s = add_slide(prs, "White ARA BG")
    set_ara_title(s, "Dashboard Overview")
    y = lead(s, "Executive visibility without assembling a leadership pack.")
    accent_line(s, BODY_X, y - 0.08, 1.8)

    kpis = [
        ("128", "Applications", ACCENT4),
        ("64", "Licenses", TEAL),
        ("18", "Vendors", ACCENT2),
        ("24", "Departments", ACCENT3),
        ("860", "Users", ACCENT1),
        ("3", "SSO / IdP", ACCENT5),
        ("4.2k", "Audit Events", ACCENT2),
    ]
    for i, (val, label, color) in enumerate(kpis):
        x = BODY_X + i * 1.65
        c = card(s, x, 1.75, 1.55, 1.05)
        top_bar(s, x, 1.75, 1.55, color)
        v = s.shapes.add_textbox(Inches(x + 0.1), Inches(1.9), Inches(1.35), Inches(0.4))
        set_text(v, val, 18, True, NAVY, PP_ALIGN.CENTER, FONT_T)
        l = s.shapes.add_textbox(Inches(x + 0.08), Inches(2.35), Inches(1.4), Inches(0.35))
        set_text(l, label, 9, False, MUTED, PP_ALIGN.CENTER, FONT_B)

    # Laptop-style placeholder on right of motif-safe zone
    placeholder(s, SAFE_LEFT_BOTTOM, 3.05, 7.7, 3.35, "Dashboard")
    # Mini chart left of placeholder would hit motif — put chart strip above placeholder right
    notes(s, "Illustrative KPIs. Replace dashboard placeholder with product screenshot.")
    fade(s)


def s09(prs):
    s = add_slide(prs, "White ARA BG")
    set_ara_title(s, "Core Modules")
    y = lead(s, "Each module delivers a business governance outcome.")
    accent_line(s, BODY_X, y - 0.08, 1.8)

    modules = [
        ("Applications", "Digital asset inventory & ownership", ACCENT1),
        ("Licenses", "Entitlement, usage & renewals", TEAL),
        ("Vendors", "Third-party criticality", ACCENT2),
        ("Departments", "Organizational accountability", ACCENT3),
        ("Users", "Workforce & contractor identity", ACCENT4),
        ("Roles", "Access governance & least privilege", ACCENT5),
        ("Identity Providers", "Enterprise authentication / SSO", ACCENT1),
        ("Reports", "Executive decision support", TEAL),
        ("Audit Logs", "Compliance evidence trail", ACCENT2),
    ]
    for i, (name, desc, color) in enumerate(modules):
        row, col = divmod(i, 3)
        x = BODY_X + col * 3.85
        yy = 1.8 + row * 1.5
        c = card(s, x, yy, 3.65, 1.3)
        side_bar(s, x, yy, 1.3, color)
        t = s.shapes.add_textbox(Inches(x + 0.3), Inches(yy + 0.2), Inches(3.15), Inches(0.35))
        set_text(t, name, 14, True, NAVY, font=FONT_T)
        d = s.shapes.add_textbox(Inches(x + 0.3), Inches(yy + 0.65), Inches(3.15), Inches(0.45))
        set_text(d, desc, 12, False, MUTED, font=FONT_B)
    notes(s, "Translate each card to a business outcome.")
    fade(s)


def s10(prs):
    s = add_slide(prs, "White ARA BG")
    set_ara_title(s, "Who Can Benefit?")
    y = lead(s, "CENTRIX serves the full IT value chain — ops to the board.")
    accent_line(s, BODY_X, y - 0.08, 1.8)

    personas = [
        ("Infrastructure", "Pain: undocumented deps", "Gain: estate clarity"),
        ("Service Desk", "Pain: ownership unknown", "Gain: faster routing"),
        ("Cybersecurity", "Pain: access drift", "Gain: least privilege"),
        ("IT Operations", "Pain: manual tracking", "Gain: one inventory"),
        ("IT Management", "Pain: slow reports", "Gain: live KPIs"),
        ("Enterprise Arch.", "Pain: duplicate systems", "Gain: portfolio view"),
        ("App Owners", "Pain: unclear ownership", "Gain: accountability"),
        ("Procurement", "Pain: renewal surprises", "Gain: foresight"),
        ("Compliance", "Pain: weak evidence", "Gain: audit trail"),
        ("Internal Audit", "Pain: reconstruction", "Gain: retrieval"),
        ("Executive Mgmt", "Pain: fragmented packs", "Gain: trusted decisions"),
    ]
    # 4 + 4 on upper area; 3 on bottom starting clear of motif
    for i, (role, pain, gain) in enumerate(personas):
        if i < 8:
            row, col = divmod(i, 4)
            x = BODY_X + col * 2.9
            yy = 1.75 + row * 1.55
            w = 2.75
        else:
            x = SAFE_LEFT_BOTTOM + (i - 8) * 2.55
            yy = 4.9
            w = 2.4
        c = card(s, x, yy, w, 1.35)
        t = s.shapes.add_textbox(Inches(x + 0.12), Inches(yy + 0.12), Inches(w - 0.24), Inches(0.3))
        set_text(t, role, 11, True, ACCENT1, font=FONT_T)
        p = s.shapes.add_textbox(Inches(x + 0.12), Inches(yy + 0.5), Inches(w - 0.24), Inches(0.3))
        set_text(p, pain, 10, False, ACCENT2, font=FONT_B)
        g = s.shapes.add_textbox(Inches(x + 0.12), Inches(yy + 0.9), Inches(w - 0.24), Inches(0.3))
        set_text(g, gain, 10, False, ACCENT3, font=FONT_B)
    notes(s, "Highlight 3–4 personas in the room.")
    fade(s)


def s11(prs):
    s = add_slide(prs, "Grey ARA BG")
    set_ara_title(s, "Security & Governance")
    y = lead(s, "Control by design — the platform is itself governed.")
    accent_line(s, BODY_X, y - 0.08, 1.8)

    items = [
        ("RBAC", "Role-based access", ACCENT1),
        ("SSO", "Single sign-on", ACCENT4),
        ("Federation", "Identity federation", TEAL),
        ("Role Mapping", "Directory → platform roles", ACCENT5),
        ("Audit Logs", "Evidence on demand", ACCENT2),
        ("Activity Tracking", "Sensitive change trail", ACCENT1),
        ("Least Privilege", "Need-to-know access", ACCENT3),
        ("Auth Modes", "Local + federated", ACCENT4),
        ("Approval-Ready", "Workflow-capable design", ACCENT2),
    ]
    for i, (code, label, color) in enumerate(items):
        row, col = divmod(i, 3)
        x = BODY_X + col * 3.85
        yy = 1.8 + row * 1.5
        c = card(s, x, yy, 3.65, 1.3, WHITE)
        side_bar(s, x, yy, 1.3, color)
        t = s.shapes.add_textbox(Inches(x + 0.3), Inches(yy + 0.22), Inches(3.15), Inches(0.35))
        set_text(t, code, 14, True, NAVY, font=FONT_T)
        d = s.shapes.add_textbox(Inches(x + 0.3), Inches(yy + 0.7), Inches(3.15), Inches(0.4))
        set_text(d, label, 12, False, MUTED, font=FONT_B)
    notes(s, "Reassure security leaders without protocol deep-dives.")
    fade(s)


def s12(prs):
    s = add_slide(prs, "White ARA BG")
    set_ara_title(s, "Business Value")
    y = lead(s, "Outcomes measured in time, risk, cost, and decision quality.")
    accent_line(s, BODY_X, y - 0.08, 1.8)

    outcomes = [
        "Reduced Manual Work",
        "Better Compliance",
        "Improved Visibility",
        "Lower Operational Risk",
        "Faster Audits",
        "License Cost Optimization",
        "Better Decision Making",
    ]
    colors = [ACCENT4, ACCENT3, ACCENT1, ACCENT2, TEAL, ACCENT2, ACCENT5]
    for i, (label, color) in enumerate(zip(outcomes, colors)):
        yy = 1.75 + i * 0.65
        c = card(s, BODY_X, yy, 5.5, 0.55)
        side_bar(s, BODY_X, yy, 0.55, color)
        t = s.shapes.add_textbox(Inches(BODY_X + 0.3), Inches(yy + 0.1), Inches(5.0), Inches(0.35))
        set_text(t, label, 13, True, NAVY, font=FONT_B)

    # Charts on the right — clear of left motif
    t1 = s.shapes.add_textbox(Inches(7.1), Inches(1.7), Inches(5.3), Inches(0.28))
    set_text(t1, "Applications by Department", 11, True, MUTED)
    pie(s, 7.0, 2.0, 5.4, 2.2, ["IT", "Tax", "Customs", "Shared"], [0.42, 0.22, 0.18, 0.18])
    t2 = s.shapes.add_textbox(Inches(7.1), Inches(4.3), Inches(5.3), Inches(0.28))
    set_text(t2, "Application Growth", 11, True, MUTED)
    line_chart(s, 7.0, 4.55, 5.4, 1.9, ["2022", "2023", "2024", "2025", "2026"], [45, 62, 78, 98, 128])
    notes(s, "Propose a 90-day value baseline with Finance and IT.")
    fade(s)


def s13(prs):
    s = add_slide(prs, "White ARA BG")
    set_ara_title(s, "Future Roadmap")
    y = lead(s, "Control first — then automation, integration, and AI.")
    accent_line(s, BODY_X, y - 0.08, 1.8)

    line = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.3), Inches(2.55), Inches(10.7), Inches(0.05))
    line.fill.solid()
    line.fill.fore_color.rgb = TEAL
    line.line.fill.background()

    phases = [
        ("1", "Portfolio", "Done", ACCENT3),
        ("2", "Licenses", "Done", ACCENT3),
        ("3", "Identity", "Done", ACCENT3),
        ("4", "Workflows", "Future", ACCENT4),
        ("5", "CMDB", "Future", ACCENT4),
        ("6", "ServiceNow", "Future", ACCENT4),
        ("7", "AI Insights", "Future", ACCENT5),
        ("8", "Predictive", "Future", ACCENT5),
        ("9", "Mobile", "Future", ACCENT2),
    ]
    for i, (num, name, status, color) in enumerate(phases):
        x = 1.25 + i * 1.28
        dot = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(x + 0.38), Inches(2.42), Inches(0.3), Inches(0.3))
        dot.fill.solid()
        dot.fill.fore_color.rgb = color
        dot.line.fill.background()
        yy = 2.95 if i % 2 == 0 else 4.75
        c = card(s, x, yy, 1.2, 1.5)
        n = s.shapes.add_textbox(Inches(x + 0.05), Inches(yy + 0.12), Inches(1.1), Inches(0.25))
        set_text(n, f"P{num}", 10, True, color, PP_ALIGN.CENTER)
        t = s.shapes.add_textbox(Inches(x + 0.05), Inches(yy + 0.45), Inches(1.1), Inches(0.55))
        set_text(t, name, 11, True, NAVY, PP_ALIGN.CENTER, FONT_B)
        st = s.shapes.add_textbox(Inches(x + 0.05), Inches(yy + 1.1), Inches(1.1), Inches(0.25))
        set_text(st, status, 10, False, ACCENT3 if status == "Done" else MUTED, PP_ALIGN.CENTER)
    notes(s, "Do not over-promise dates.")
    fade(s)


def s14(prs):
    s = add_slide(prs, "1_Divider 3")
    # Title sits in the teal band already on the layout
    band = s.shapes.add_textbox(Inches(3.1), Inches(3.35), Inches(8.2), Inches(1.15))
    set_text(
        band,
        "To become the single trusted platform for managing\nthe complete IT ecosystem across the organization.",
        16,
        True,
        WHITE,
        PP_ALIGN.CENTER,
        FONT_T,
    )
    eye = s.shapes.add_textbox(Inches(3.1), Inches(2.55), Inches(8.2), Inches(0.35))
    set_text(eye, "VISION", 12, True, TEAL, PP_ALIGN.CENTER, FONT_B)
    # Pillars below the accent line
    pillars = ["People", "Processes", "Technology", "Governance", "Automation", "AI", "Analytics", "Compliance"]
    for i, p in enumerate(pillars):
        x = 1.35 + i * 1.45
        pill(s, x, 5.05, 1.35, 0.55, p, NAVY, WHITE)
    notes(s, "Pause after the vision statement.")
    fade(s)


def s15(prs):
    s = add_slide(prs, "White ARA BG")
    set_ara_title(s, "Live Demonstration")
    y = lead(s, "See → Own → Control → Govern → Prove")
    accent_line(s, BODY_X, y - 0.08, 1.8)

    steps = [
        "Dashboard", "Applications", "Licenses", "Departments", "Users",
        "Roles", "Identity Providers", "Audit Logs", "Reports",
    ]
    for i, step in enumerate(steps):
        if i < 5:
            x, yy = BODY_X + i * 2.3, 1.85
        else:
            x, yy = BODY_X + 1.15 + (i - 5) * 2.3, 3.55
        c = card(s, x, yy, 2.15, 1.35, NAVY if i == 0 else WHITE)
        n = s.shapes.add_textbox(Inches(x + 0.15), Inches(yy + 0.25), Inches(1.85), Inches(0.3))
        set_text(n, f"{i+1:02d}", 11, True, TEAL if i else TEAL)
        t = s.shapes.add_textbox(Inches(x + 0.15), Inches(yy + 0.65), Inches(1.85), Inches(0.5))
        set_text(t, step, 12, True, WHITE if i == 0 else NAVY, font=FONT_T)

    tip = card(s, SAFE_LEFT_BOTTOM, 5.25, 7.7, 1.15, LIGHT)
    set_text(tip, "12–15 min  ·  One executive question mid-demo  ·  End on Dashboard / Reports", 13, False, MUTED, PP_ALIGN.CENTER, FONT_B)
    notes(s, "Restate the flow once, then open the live system.")
    fade(s)


def s16(prs):
    s = add_slide(prs, "Cover 20 ARA")
    eye = s.shapes.add_textbox(Inches(5.4), Inches(2.6), Inches(7.2), Inches(0.3))
    set_text(eye, "THANK YOU", 12, True, TEAL, font=FONT_B)
    accent_line(s, 5.4, 2.95, 1.6)
    h = s.shapes.add_textbox(Inches(5.4), Inches(3.15), Inches(7.2), Inches(0.8))
    set_text(h, "Questions", 40, True, WHITE, font=FONT_T)
    sub = s.shapes.add_textbox(Inches(5.4), Inches(4.15), Inches(7.2), Inches(0.45))
    set_text(sub, "CENTRIX  ·  Enterprise IT Portfolio & Access Governance", 14, False, ACCENT4, font=FONT_B)
    meta = s.shapes.add_textbox(Inches(5.4), Inches(5.2), Inches(7.2), Inches(0.4))
    set_text(meta, "We welcome your guidance, sponsorship, and questions.", 12, False, RGBColor(0x9A, 0xAA, 0xBA), font=FONT_B)
    notes(s, "Close with sponsorship ask if not already stated.")
    fade(s)


def build():
    if OUT.exists():
        shutil.copy2(OUT, BACKUP)
    shutil.copy2(STYLE, OUT)
    prs = Presentation(str(OUT))
    delete_all_slides(prs)

    for fn in [s01, s02, s03, s04, s05, s06, s07, s08, s09, s10, s11, s12, s13, s14, s15, s16]:
        fn(prs)

    prs.save(str(OUT))
    print(f"Wrote {OUT} ({len(prs.slides)} slides)")
    for i, slide in enumerate(list(prs.slides)[:5], 1):
        title_txt = None
        for sh in slide.shapes:
            if getattr(sh, "is_placeholder", False) and sh.top.inches < 1 and sh.width.inches > 8:
                title_txt = sh.text_frame.text.strip()
        # also check first text near title slot
        print(f"  slide {i} layout={slide.slide_layout.name} title_slot={title_txt!r}")
        ys = []
        for sh in slide.shapes:
            if sh.has_text_frame and sh.text_frame.text.strip() and "Public" not in sh.text_frame.text:
                ys.append((round(sh.top.inches, 2), sh.text_frame.text.strip().split("\n")[0][:50]))
        ys.sort()
        print("   top texts:", ys[:4])


if __name__ == "__main__":
    build()
