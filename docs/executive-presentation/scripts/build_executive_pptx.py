#!/usr/bin/env python3
"""Generate a visual, Big-Four-style executive PowerPoint for IT Portfolio & Access Management."""

from __future__ import annotations

from pathlib import Path

from pptx import Presentation
from pptx.chart.data import CategoryChartData
from pptx.dml.color import RGBColor
from pptx.enum.chart import XL_CHART_TYPE, XL_LEGEND_POSITION
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Emu, Inches, Pt

# ---------------------------------------------------------------------------
# Theme (corporate blue / white — consulting style)
# ---------------------------------------------------------------------------
NAVY = RGBColor(0x0B, 0x1F, 0x33)
BLUE = RGBColor(0x0C, 0x4A, 0x6E)
ACCENT = RGBColor(0x02, 0x84, 0xC7)  # sky-600
TEAL = RGBColor(0x0F, 0x76, 0x6E)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
LIGHT = RGBColor(0xF1, 0xF5, 0xF9)
MUTED = RGBColor(0x64, 0x74, 0x8B)
SLATE = RGBColor(0x33, 0x41, 0x55)
RISK = RGBColor(0xB9, 0x1C, 0x1C)
AMBER = RGBColor(0xB4, 0x53, 0x09)
GREEN = RGBColor(0x15, 0x80, 0x3D)
LINE = RGBColor(0xE2, 0xE8, 0xF0)

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "screenshots"
OUT = ROOT / "IT-Portfolio-Executive-Briefing.pptx"

# Live KPIs from application (Jul 2026 snapshot)
KPI = {
    "applications": 67,
    "licenses": 6,
    "vendors": 5,
    "departments": 3,
    "users": 59,
    "sso": 1,
    "audit": 120,
}


def set_run(run, text: str, size: int, bold: bool = False, color: RGBColor = NAVY, font: str = "Calibri"):
    run.text = text
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = font


def add_text(shape, text: str, size: int, bold: bool = False, color: RGBColor = NAVY, align=PP_ALIGN.LEFT):
    tf = shape.text_frame
    tf.clear()
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    set_run(p.add_run(), text, size, bold, color)


def add_para(tf, text: str, size: int, bold: bool = False, color: RGBColor = SLATE, space_before: int = 0):
    p = tf.add_paragraph()
    p.space_before = Pt(space_before)
    set_run(p.add_run(), text, size, bold, color)
    return p


def blank_slide(prs: Presentation):
    return prs.slides.add_slide(prs.slide_layouts[6])


def notes(slide, text: str):
    slide.notes_slide.notes_text_frame.text = text


def bar(slide, color: RGBColor = ACCENT, height: float = 0.08):
    s = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(height))
    s.fill.solid()
    s.fill.fore_color.rgb = color
    s.line.fill.background()
    return s


def footer(slide, section: str, page: int, total: int):
    # left
    box = slide.shapes.add_textbox(Inches(0.5), Inches(7.15), Inches(8), Inches(0.3))
    add_text(box, f"{section}  |  IT Portfolio & Access Management  ·  Confidential", 9, False, MUTED)
    # right
    box2 = slide.shapes.add_textbox(Inches(11.2), Inches(7.15), Inches(1.6), Inches(0.3))
    add_text(box2, f"{page} / {total}", 9, False, MUTED, PP_ALIGN.RIGHT)


def title_block(slide, eyebrow: str, title: str, message: str | None = None):
    eye = slide.shapes.add_textbox(Inches(0.5), Inches(0.28), Inches(12), Inches(0.3))
    add_text(eye, eyebrow.upper(), 11, True, ACCENT)
    h = slide.shapes.add_textbox(Inches(0.5), Inches(0.55), Inches(12.2), Inches(0.55))
    add_text(h, title, 28, True, NAVY)
    if message:
        m = slide.shapes.add_textbox(Inches(0.5), Inches(1.1), Inches(12.2), Inches(0.35))
        add_text(m, message, 14, False, MUTED)


def card(slide, left, top, width, height, fill: RGBColor = WHITE, line: RGBColor = LINE):
    s = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    s.line.color.rgb = line
    s.line.width = Pt(1)
    try:
        s.adjustments[0] = 0.08
    except Exception:
        pass
    return s


def kpi_card(slide, left, top, width, height, value: str, label: str, accent: RGBColor = ACCENT):
    c = card(slide, left, top, width, height, WHITE, LINE)
    accent_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, Inches(0.08), height)
    accent_bar.fill.solid()
    accent_bar.fill.fore_color.rgb = accent
    accent_bar.line.fill.background()
    v = slide.shapes.add_textbox(left + Inches(0.25), top + Inches(0.25), width - Inches(0.35), Inches(0.55))
    add_text(v, value, 28, True, NAVY)
    l = slide.shapes.add_textbox(left + Inches(0.25), top + Inches(0.85), width - Inches(0.35), Inches(0.4))
    add_text(l, label, 11, False, MUTED)
    return c


def pill(slide, left, top, width, height, text: str, fill: RGBColor, font_color: RGBColor = WHITE):
    s = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    s.line.fill.background()
    try:
        s.adjustments[0] = 0.5
    except Exception:
        pass
    add_text(s, text, 11, True, font_color, PP_ALIGN.CENTER)
    s.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER
    return s


def arrow_chevron(slide, left, top, width, height, text: str, fill: RGBColor):
    s = slide.shapes.add_shape(MSO_SHAPE.CHEVRON, left, top, width, height)
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    s.line.fill.background()
    add_text(s, text, 12, True, WHITE, PP_ALIGN.CENTER)
    for p in s.text_frame.paragraphs:
        p.alignment = PP_ALIGN.CENTER
    s.text_frame.word_wrap = True
    return s


def try_picture(slide, path: Path, left, top, width, height):
    if path.exists():
        slide.shapes.add_picture(str(path), left, top, width=width, height=height)
        return True
    # placeholder frame
    ph = card(slide, left, top, width, height, LIGHT, LINE)
    add_text(ph, "Application screenshot", 12, False, MUTED, PP_ALIGN.CENTER)
    return False


def add_pie(slide, left, top, width, height, title: str, categories: list[str], values: list[float]):
    data = CategoryChartData()
    data.categories = categories
    data.add_series(title, values)
    chart = slide.shapes.add_chart(XL_CHART_TYPE.DOUGHNUT, left, top, width, height, data).chart
    chart.has_legend = True
    chart.legend.position = XL_LEGEND_POSITION.BOTTOM
    chart.legend.include_in_layout = False
    plot = chart.plots[0]
    plot.has_data_labels = True
    try:
        plot.data_labels.number_format = "0%"
        plot.data_labels.font.size = Pt(9)
    except Exception:
        pass
    return chart


def add_bar(slide, left, top, width, height, title: str, categories: list[str], values: list[float], color: RGBColor = ACCENT):
    data = CategoryChartData()
    data.categories = categories
    data.add_series(title, values)
    chart = slide.shapes.add_chart(XL_CHART_TYPE.COLUMN_CLUSTERED, left, top, width, height, data).chart
    chart.has_legend = False
    series = chart.series[0]
    series.format.fill.solid()
    series.format.fill.fore_color.rgb = color
    return chart


def add_line(slide, left, top, width, height, categories: list[str], values: list[float]):
    data = CategoryChartData()
    data.categories = categories
    data.add_series("Applications", values)
    chart = slide.shapes.add_chart(XL_CHART_TYPE.LINE_MARKERS, left, top, width, height, data).chart
    chart.has_legend = False
    return chart


def add_stacked(slide, left, top, width, height, categories: list[str], series: dict[str, list[float]]):
    data = CategoryChartData()
    data.categories = categories
    for name, vals in series.items():
        data.add_series(name, vals)
    chart = slide.shapes.add_chart(XL_CHART_TYPE.COLUMN_STACKED, left, top, width, height, data).chart
    chart.has_legend = True
    chart.legend.position = XL_LEGEND_POSITION.BOTTOM
    return chart


# ---------------------------------------------------------------------------
# Slides
# ---------------------------------------------------------------------------

TOTAL = 16


def slide_title(prs):
    s = blank_slide(prs)
    bg = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
    bg.fill.solid()
    bg.fill.fore_color.rgb = NAVY
    bg.line.fill.background()
    accent = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(0.15), Inches(7.5))
    accent.fill.solid()
    accent.fill.fore_color.rgb = ACCENT
    accent.line.fill.background()

    eye = s.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(11), Inches(0.35))
    add_text(eye, "EXECUTIVE BRIEFING  ·  CONFIDENTIAL", 12, True, ACCENT)
    h = s.shapes.add_textbox(Inches(0.8), Inches(2.3), Inches(11.2), Inches(1.4))
    add_text(h, "IT Portfolio & Access Management", 36, True, WHITE)
    sub = s.shapes.add_textbox(Inches(0.8), Inches(3.8), Inches(10.5), Inches(0.9))
    add_text(sub, "Enterprise governance for applications, licenses,\nidentity, and executive decision support", 18, False, RGBColor(0xCB, 0xD5, 0xE1))

    meta = s.shapes.add_textbox(Inches(0.8), Inches(5.4), Inches(11), Inches(0.8))
    tf = meta.text_frame
    tf.clear()
    p = tf.paragraphs[0]
    set_run(p.add_run(), "Audience: CIO  ·  IT Directors  ·  Department Managers  ·  Executive Management", 12, False, RGBColor(0x94, 0xA3, 0xB8))

    notes(s, "Open as a governance and risk conversation — not a software demo. "
             "Promise a clear arc: current state → risk → solution → value → roadmap → decision.")


def slide_agenda(prs, page):
    s = blank_slide(prs)
    bar(s)
    title_block(s, "Agenda", "Strategic narrative", "A decision journey — not a feature tour")
    items = [
        ("01", "Why change", "Challenges & business impact"),
        ("02", "What we propose", "Enterprise IT Governance Platform"),
        ("03", "How value is created", "Capabilities, security, analytics"),
        ("04", "What comes next", "Roadmap, ROI, live proof"),
    ]
    for i, (num, title, desc) in enumerate(items):
        left = Inches(0.5 + i * 3.15)
        c = card(s, left, Inches(2.0), Inches(3.0), Inches(3.6), LIGHT)
        n = s.shapes.add_textbox(left + Inches(0.25), Inches(2.3), Inches(2.5), Inches(0.5))
        add_text(n, num, 28, True, ACCENT)
        t = s.shapes.add_textbox(left + Inches(0.25), Inches(3.1), Inches(2.5), Inches(0.6))
        add_text(t, title, 16, True, NAVY)
        d = s.shapes.add_textbox(left + Inches(0.25), Inches(3.8), Inches(2.5), Inches(1.2))
        add_text(d, desc, 12, False, MUTED)
    footer(s, "Agenda", page, TOTAL)
    notes(s, "Keep agenda under 45 seconds. Emphasize this is a strategic initiative briefing.")


def slide_exec_summary(prs, page):
    s = blank_slide(prs)
    bar(s)
    title_block(s, "01  Executive Summary", "We cannot govern what we cannot see",
                "Key message: Manual portfolio management does not scale")

    # Journey diagram
    steps = [
        (NAVY, "Scattered\nrecords"),
        (AMBER, "Blind\nspots"),
        (RISK, "Risk &\ncost"),
        (TEAL, "Governed\nplatform"),
        (ACCENT, "Executive\nclarity"),
    ]
    for i, (color, label) in enumerate(steps):
        left = Inches(0.5 + i * 2.5)
        arrow_chevron(s, left, Inches(2.2), Inches(2.35), Inches(1.35), label, color)

    # Three outcome cards
    cards = [
        ("Fragmented control", "Apps, licenses, and owners live in spreadsheets and inboxes"),
        ("Rising exposure", "Expiry, access drift, and audit friction go unnoticed"),
        ("Limited foresight", "Leaders lack a trusted view for decisions"),
    ]
    for i, (t, d) in enumerate(cards):
        left = Inches(0.5 + i * 4.2)
        c = card(s, left, Inches(4.0), Inches(4.0), Inches(2.4))
        ht = s.shapes.add_textbox(left + Inches(0.25), Inches(4.25), Inches(3.5), Inches(0.45))
        add_text(ht, t, 14, True, NAVY)
        hd = s.shapes.add_textbox(left + Inches(0.25), Inches(4.8), Inches(3.5), Inches(1.2))
        add_text(hd, d, 12, False, MUTED)

    footer(s, "01 Executive Summary", page, TOTAL)
    notes(s, "State the thesis once. Do not list features. Connect to audit season and renewal surprises.")


def slide_challenges(prs, page):
    s = blank_slide(prs)
    bar(s)
    title_block(s, "02  Current Challenges", "Today’s operating model creates avoidable complexity",
                "Key message: The issue is not effort — it is the absence of a system of record")

    cols = [
        (AMBER, "Inventory", ["Scattered spreadsheets", "Unknown owners", "No single inventory", "Shadow / duplicate apps"]),
        (RISK, "Licenses & Vendors", ["Expiry surprises", "Weak utilization view", "Environment blind spots", "Unclear vendor criticality"]),
        (BLUE, "Governance", ["Inconsistent access", "Thin audit trail", "Slow reporting", "Knowledge loss"]),
    ]
    for i, (color, title, bullets) in enumerate(cols):
        left = Inches(0.5 + i * 4.2)
        c = card(s, left, Inches(1.8), Inches(4.0), Inches(4.7))
        hdr = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, Inches(1.8), Inches(4.0), Inches(0.6))
        hdr.fill.solid()
        hdr.fill.fore_color.rgb = color
        hdr.line.fill.background()
        add_text(hdr, title, 14, True, WHITE, PP_ALIGN.CENTER)
        for j, b in enumerate(bullets):
            tb = s.shapes.add_textbox(left + Inches(0.3), Inches(2.7 + j * 0.7), Inches(3.4), Inches(0.55))
            add_text(tb, f"●  {b}", 13, False, SLATE)

    footer(s, "02 Current Challenges", page, TOTAL)
    notes(s, "Ask rhetorically: can we produce an authoritative list of production apps, owners, and licenses expiring this quarter in under one hour?")


def slide_impact(prs, page):
    s = blank_slide(prs)
    bar(s)
    title_block(s, "03  Business Impact", "What inaction costs the organization",
                "Key message: Fragmentation is a risk, cost, and accountability issue")

    metrics = [
        ("↑ Risk", "Unowned systems &\nunclear access", RISK),
        ("↑ Cost", "Shelfware &\nlate renewals", AMBER),
        ("↓ Speed", "Manual reporting\ncycles", BLUE),
        ("↓ Trust", "Conflicting sources\nof truth", NAVY),
    ]
    for i, (val, label, color) in enumerate(metrics):
        left = Inches(0.5 + i * 3.15)
        c = card(s, left, Inches(1.9), Inches(3.0), Inches(2.4))
        bar_l = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, Inches(1.9), Inches(3.0), Inches(0.12))
        bar_l.fill.solid()
        bar_l.fill.fore_color.rgb = color
        bar_l.line.fill.background()
        v = s.shapes.add_textbox(left + Inches(0.2), Inches(2.3), Inches(2.6), Inches(0.6))
        add_text(v, val, 26, True, color, PP_ALIGN.CENTER)
        l = s.shapes.add_textbox(left + Inches(0.2), Inches(3.1), Inches(2.6), Inches(0.9))
        add_text(l, label, 12, False, MUTED, PP_ALIGN.CENTER)

    # impact flow
    flow = ["Operational risk", "Compliance pressure", "Poor decisions", "Duplicate spend"]
    for i, t in enumerate(flow):
        left = Inches(0.5 + i * 3.15)
        pill(s, left, Inches(4.8), Inches(3.0), Inches(0.55), t, LIGHT, NAVY)
        if i < 3:
            arr = s.shapes.add_textbox(left + Inches(2.85), Inches(4.85), Inches(0.4), Inches(0.4))
            add_text(arr, "→", 16, True, ACCENT)

    footer(s, "03 Business Impact", page, TOTAL)
    notes(s, "Keep sober — no scare tactics. One real internal anecdote is enough if available.")


def slide_solution(prs, page):
    s = blank_slide(prs)
    bar(s)
    title_block(s, "04  Proposed Solution", "An Enterprise IT Governance Platform",
                "Key message: From fragmented records → governed enterprise intelligence")

    # Hub diagram
    center = card(s, Inches(4.6), Inches(3.0), Inches(4.1), Inches(1.8), NAVY, NAVY)
    add_text(center, "IT Portfolio &\nAccess Management", 16, True, WHITE, PP_ALIGN.CENTER)

    spokes = [
        (Inches(0.5), Inches(1.9), "Application\nPortfolio"),
        (Inches(9.7), Inches(1.9), "License\nGovernance"),
        (Inches(0.5), Inches(5.0), "Identity &\nAccess"),
        (Inches(9.7), Inches(5.0), "Executive\nInsights"),
    ]
    for left, top, label in spokes:
        c = card(s, left, top, Inches(3.0), Inches(1.3), LIGHT)
        add_text(c, label, 14, True, NAVY, PP_ALIGN.CENTER)

    footer(s, "04 Proposed Solution", page, TOTAL)
    notes(s, "Name the product once, then stay on outcomes: system of record + system of insight.")


def slide_capabilities(prs, page):
    s = blank_slide(prs)
    bar(s)
    title_block(s, "05  Core Capabilities", "Nine capabilities that turn governance into daily practice",
                "Key message: Every capability maps to a business outcome")

    caps = [
        ("01", "Centralized Portfolio", "Digital asset governance"),
        ("02", "License Lifecycle", "Cost optimization"),
        ("03", "Vendor Management", "Third-party clarity"),
        ("04", "Department Ownership", "Accountability"),
        ("05", "Environment Tracking", "Operational awareness"),
        ("06", "Users & Roles", "Access governance"),
        ("07", "Identity / SSO", "Enterprise authentication"),
        ("08", "Audit Logging", "Compliance evidence"),
        ("09", "Executive Dashboards", "Decision support"),
    ]
    for i, (num, title, outcome) in enumerate(caps):
        row, col = divmod(i, 3)
        left = Inches(0.5 + col * 4.2)
        top = Inches(1.75 + row * 1.7)
        c = card(s, left, top, Inches(4.0), Inches(1.5))
        n = s.shapes.add_textbox(left + Inches(0.2), top + Inches(0.2), Inches(0.6), Inches(0.35))
        add_text(n, num, 12, True, ACCENT)
        t = s.shapes.add_textbox(left + Inches(0.2), top + Inches(0.55), Inches(3.5), Inches(0.35))
        add_text(t, title, 14, True, NAVY)
        o = s.shapes.add_textbox(left + Inches(0.2), top + Inches(0.95), Inches(3.5), Inches(0.35))
        add_text(o, outcome, 12, False, MUTED)

    footer(s, "05 Capabilities", page, TOTAL)
    notes(s, "Read 3–4 capabilities aloud. Translate live: license management = stop paying for shelfware.")


def slide_benefits(prs, page):
    s = blank_slide(prs)
    bar(s)
    title_block(s, "06  Business Benefits", "Outcomes leadership should expect",
                "Key message: Value appears when the platform becomes the trusted default")

    benefits = [
        ("Better\ngovernance", TEAL),
        ("Single source\nof truth", ACCENT),
        ("Lower\nops risk", NAVY),
        ("Faster\naudits", BLUE),
        ("Less software\nwaste", AMBER),
        ("Stronger\ncompliance", GREEN),
        ("Executive\nvisibility", ACCENT),
        ("Clear\naccountability", TEAL),
    ]
    for i, (label, color) in enumerate(benefits):
        row, col = divmod(i, 4)
        left = Inches(0.5 + col * 3.15)
        top = Inches(1.9 + row * 2.4)
        c = card(s, left, top, Inches(3.0), Inches(2.1))
        circle = s.shapes.add_shape(MSO_SHAPE.OVAL, left + Inches(1.05), top + Inches(0.3), Inches(0.9), Inches(0.9))
        circle.fill.solid()
        circle.fill.fore_color.rgb = color
        circle.line.fill.background()
        t = s.shapes.add_textbox(left + Inches(0.2), top + Inches(1.3), Inches(2.6), Inches(0.7))
        add_text(t, label, 13, True, NAVY, PP_ALIGN.CENTER)

    footer(s, "06 Benefits", page, TOTAL)
    notes(s, "Pick two benefits that resonate (often audit speed + license waste).")


def slide_security(prs, page):
    s = blank_slide(prs)
    bar(s)
    title_block(s, "07  Security & Governance", "Control by design — not by heroics",
                "Key message: The portfolio platform must itself be governed")

    items = [
        ("RBAC", "Role-based\naccess control"),
        ("SSO", "Enterprise\nauthentication"),
        ("Map", "Role\nmapping"),
        ("Audit", "Audit\nlogging"),
        ("Track", "Activity\ntracking"),
        ("Least", "Least\nprivilege"),
    ]
    for i, (icon, label) in enumerate(items):
        col = i % 3
        row = i // 3
        left = Inches(0.7 + col * 4.1)
        top = Inches(1.9 + row * 2.4)
        c = card(s, left, top, Inches(3.8), Inches(2.1))
        badge = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left + Inches(1.15), top + Inches(0.3), Inches(1.5), Inches(0.55))
        badge.fill.solid()
        badge.fill.fore_color.rgb = NAVY
        badge.line.fill.background()
        add_text(badge, icon, 12, True, WHITE, PP_ALIGN.CENTER)
        t = s.shapes.add_textbox(left + Inches(0.3), top + Inches(1.1), Inches(3.2), Inches(0.8))
        add_text(t, label, 14, True, NAVY, PP_ALIGN.CENTER)

    footer(s, "07 Security & Governance", page, TOTAL)
    notes(s, "Reassure security stakeholders. Avoid protocol deep-dives unless asked.")


def slide_executive_dashboard(prs, page):
    s = blank_slide(prs)
    bar(s)
    title_block(s, "08  Executive Dashboard", "Decision-ready portfolio intelligence",
                "Key message: Leadership questions answered without assembling a deck")

    # KPI row
    kpis = [
        (str(KPI["applications"]), "Applications", ACCENT),
        (str(KPI["licenses"]), "Licenses", TEAL),
        (str(KPI["vendors"]), "Active Vendors", BLUE),
        (str(KPI["departments"]), "Departments", NAVY),
        (str(KPI["users"]), "Users", ACCENT),
        (str(KPI["sso"]), "SSO Providers", TEAL),
        (str(KPI["audit"]) + "+", "Audit Events", AMBER),
    ]
    for i, (val, label, color) in enumerate(kpis):
        left = Inches(0.35 + i * 1.85)
        kpi_card(s, left, Inches(1.55), Inches(1.75), Inches(1.25), val, label, color)

    # Charts
    add_pie(
        s, Inches(0.4), Inches(3.05), Inches(4.0), Inches(3.6),
        "License Status",
        ["Active", "Expiring Soon", "Expired"],
        [0.83, 0.17, 0.0],
    )
    add_bar(
        s, Inches(4.6), Inches(3.05), Inches(4.2), Inches(3.6),
        "Apps by Department",
        ["General IT", "Customs", "Tax & Zakat"],
        [67, 0, 0],
        ACCENT,
    )
    add_pie(
        s, Inches(9.0), Inches(3.05), Inches(3.9), Inches(3.6),
        "License Environment",
        ["Production", "Other"],
        [0.5, 0.5],
    )

    # chart titles
    for left, title in [(0.5, "License Status"), (4.7, "Applications by Department"), (9.1, "Licenses by Environment")]:
        t = s.shapes.add_textbox(Inches(left), Inches(2.9), Inches(3.5), Inches(0.3))
        add_text(t, title, 10, True, MUTED)

    footer(s, "08 Executive Dashboard", page, TOTAL)
    notes(s, "This slide uses live portfolio indicators. Invite the room to pick one question for the live demo.")


def slide_analytics(prs, page):
    s = blank_slide(prs)
    bar(s)
    title_block(s, "09  Analytics & Decision Support", "From data hunting to decision-ready insight",
                "Key message: If a question needs three spreadsheets, it is already too late")

    # Gauge-like utilization visual via cards + charts
    util = card(s, Inches(0.5), Inches(1.8), Inches(4.0), Inches(4.7))
    ht = s.shapes.add_textbox(Inches(0.75), Inches(2.0), Inches(3.5), Inches(0.4))
    add_text(ht, "License Utilization", 14, True, NAVY)
    # big number
    big = s.shapes.add_textbox(Inches(0.75), Inches(2.7), Inches(3.5), Inches(1.0))
    add_text(big, "80%", 48, True, TEAL, PP_ALIGN.CENTER)
    sub = s.shapes.add_textbox(Inches(0.75), Inches(3.7), Inches(3.5), Inches(0.4))
    add_text(sub, "seats used vs licensed", 12, False, MUTED, PP_ALIGN.CENTER)
    for i, (lab, val) in enumerate([("Licensed", "30,482"), ("Used", "24,497"), ("Available", "6,647")]):
        y = Inches(4.4 + i * 0.55)
        pill(s, Inches(0.85), y, Inches(3.3), Inches(0.45), f"{lab}:  {val}", LIGHT, NAVY)

    add_line(
        s, Inches(4.8), Inches(1.8), Inches(4.0), Inches(4.7),
        ["2022", "2023", "2024", "2025", "2026"],
        [28, 39, 48, 58, 67],
    )
    t1 = s.shapes.add_textbox(Inches(5.0), Inches(1.9), Inches(3.5), Inches(0.3))
    add_text(t1, "Application Growth", 12, True, MUTED)

    add_stacked(
        s, Inches(9.0), Inches(1.8), Inches(3.9), Inches(4.7),
        ["Prod", "Non-Prod"],
        {"Licensed seats": [15241, 15241], "Used seats": [12248, 12249]},
    )
    t2 = s.shapes.add_textbox(Inches(9.2), Inches(1.9), Inches(3.5), Inches(0.3))
    add_text(t2, "Seats by Environment", 12, True, MUTED)

    footer(s, "09 Analytics", page, TOTAL)
    notes(s, "Prime the demo: ask which question they want answered first on the live dashboard.")


def slide_roadmap(prs, page):
    s = blank_slide(prs)
    bar(s)
    title_block(s, "10  Future Roadmap", "A platform designed to grow with enterprise ambition",
                "Key message: Start with control and truth — then add prediction")

    # horizontal timeline line
    line = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(3.55), Inches(11.7), Inches(0.08))
    line.fill.solid()
    line.fill.fore_color.rgb = ACCENT
    line.line.fill.background()

    phases = [
        ("Phase 1", "Portfolio\nManagement", "Inventory, owners,\ndepartments"),
        ("Phase 2", "License\nGovernance", "Utilization, renewals,\nenvironments"),
        ("Phase 3", "Identity\n& SSO", "Federation, role mapping,\nleast privilege"),
        ("Phase 4", "Automation\n& AI", "Alerts, workflows,\npredictive insight"),
    ]
    colors = [NAVY, BLUE, TEAL, ACCENT]
    for i, ((phase, title, detail), color) in enumerate(zip(phases, colors)):
        left = Inches(0.7 + i * 3.15)
        dot = s.shapes.add_shape(MSO_SHAPE.OVAL, left + Inches(1.2), Inches(3.35), Inches(0.45), Inches(0.45))
        dot.fill.solid()
        dot.fill.fore_color.rgb = color
        dot.line.fill.background()
        c = card(s, left, Inches(4.1), Inches(3.0), Inches(2.3))
        p = s.shapes.add_textbox(left + Inches(0.2), Inches(4.25), Inches(2.6), Inches(0.3))
        add_text(p, phase, 11, True, color)
        t = s.shapes.add_textbox(left + Inches(0.2), Inches(4.6), Inches(2.6), Inches(0.7))
        add_text(t, title, 14, True, NAVY)
        d = s.shapes.add_textbox(left + Inches(0.2), Inches(5.4), Inches(2.6), Inches(0.7))
        add_text(d, detail, 11, False, MUTED)

        # upper label
        u = s.shapes.add_textbox(left, Inches(2.3), Inches(3.0), Inches(0.8))
        add_text(u, title.replace("\n", " "), 12, True, NAVY, PP_ALIGN.CENTER)

    footer(s, "10 Roadmap", page, TOTAL)
    notes(s, "Do not over-promise dates. Emphasize sequenced risk reduction before sophistication.")


def slide_roi(prs, page):
    s = blank_slide(prs)
    bar(s)
    title_block(s, "11  Return on Investment", "Where value appears in the operating model",
                "Key message: The cheapest control failure is the one prevented by visibility")

    rois = [
        ("⏱", "Reduced Manual Effort", "Hours saved on audits,\nrenewals, leadership packs", TEAL),
        ("✓", "Better Compliance", "Evidence on demand —\nnot reconstruction", GREEN),
        ("◎", "Improved Visibility", "One trusted view for\nCIO and directors", ACCENT),
        ("↓", "Lower Ops Risk", "Fewer surprises from\nexpiry & access drift", NAVY),
        ("⚡", "Faster Reporting", "Minutes instead of\nmulti-day collation", AMBER),
    ]
    for i, (icon, title, detail, color) in enumerate(rois):
        left = Inches(0.4 + i * 2.55)
        c = card(s, left, Inches(1.9), Inches(2.45), Inches(4.5))
        circle = s.shapes.add_shape(MSO_SHAPE.OVAL, left + Inches(0.75), Inches(2.25), Inches(0.95), Inches(0.95))
        circle.fill.solid()
        circle.fill.fore_color.rgb = color
        circle.line.fill.background()
        ic = s.shapes.add_textbox(left + Inches(0.75), Inches(2.4), Inches(0.95), Inches(0.7))
        add_text(ic, icon, 18, True, WHITE, PP_ALIGN.CENTER)
        t = s.shapes.add_textbox(left + Inches(0.15), Inches(3.5), Inches(2.15), Inches(0.8))
        add_text(t, title, 13, True, NAVY, PP_ALIGN.CENTER)
        d = s.shapes.add_textbox(left + Inches(0.15), Inches(4.4), Inches(2.15), Inches(1.3))
        add_text(d, detail, 11, False, MUTED, PP_ALIGN.CENTER)

    footer(s, "11 ROI", page, TOTAL)
    notes(s, "Propose a 90-day value baseline with finance: reporting hours, urgent renewals, shelfware candidates.")


def slide_screens_portfolio(prs, page):
    s = blank_slide(prs)
    bar(s)
    title_block(s, "12  Platform Proof — Portfolio", "Governance made visible",
                "Key message: The system of record leaders can trust")

    shots = [
        ("dashboard.png", "Executive Dashboard"),
        ("applications.png", "Applications Management"),
        ("licenses.png", "License Management"),
        ("vendors.png", "Vendors"),
    ]
    for i, (fn, label) in enumerate(shots):
        col = i % 2
        row = i // 2
        left = Inches(0.5 + col * 6.4)
        top = Inches(1.65 + row * 2.65)
        try_picture(s, ASSETS / fn, left, top, Inches(6.1), Inches(2.2))
        cap = s.shapes.add_textbox(left, top + Inches(2.2), Inches(6.1), Inches(0.3))
        add_text(cap, label, 11, True, MUTED)

    footer(s, "12 Platform Proof", page, TOTAL)
    notes(s, "Use as visual proof before or during demo. Stay on business narrative — do not click through forms.")


def slide_screens_governance(prs, page):
    s = blank_slide(prs)
    bar(s)
    title_block(s, "13  Platform Proof — Governance", "Identity, access, and assurance",
                "Key message: Control and evidence are built in")

    shots = [
        ("departments.png", "Departments"),
        ("users.png", "Users"),
        ("roles.png", "Roles & Permissions"),
        ("sso.png", "Identity Providers (SSO)"),
        ("audit.png", "Audit Logs"),
        ("settings.png", "Settings / Reports context"),
    ]
    for i, (fn, label) in enumerate(shots):
        col = i % 3
        row = i // 3
        left = Inches(0.4 + col * 4.3)
        top = Inches(1.65 + row * 2.65)
        try_picture(s, ASSETS / fn, left, top, Inches(4.1), Inches(2.15))
        cap = s.shapes.add_textbox(left, top + Inches(2.15), Inches(4.1), Inches(0.3))
        add_text(cap, label, 11, True, MUTED)

    footer(s, "13 Platform Proof", page, TOTAL)
    notes(s, "Highlight SSO and audit for security/risk stakeholders; roles for IT directors.")


def slide_demo(prs, page):
    s = blank_slide(prs)
    bar(s)
    title_block(s, "14  Live Demonstration", "A business story told through the platform",
                "Key message: Demo to decide — not to explore every field")

    steps = [
        "Dashboard", "Applications", "Licenses", "Vendors", "Departments",
        "Users", "Roles", "SSO", "Audit", "Insights",
    ]
    for i, step in enumerate(steps):
        row = 0 if i < 5 else 1
        col = i if i < 5 else i - 5
        left = Inches(0.5 + col * 2.5)
        top = Inches(2.1 + row * 1.8)
        c = card(s, left, top, Inches(2.3), Inches(1.3), NAVY if i == 0 else WHITE)
        num = s.shapes.add_textbox(left + Inches(0.15), top + Inches(0.2), Inches(2.0), Inches(0.3))
        add_text(num, f"{i+1:02d}", 11, True, ACCENT if i else WHITE)
        t = s.shapes.add_textbox(left + Inches(0.15), top + Inches(0.55), Inches(2.0), Inches(0.5))
        add_text(t, step, 13, True, WHITE if i == 0 else NAVY)

    tip = card(s, Inches(0.5), Inches(5.7), Inches(12.3), Inches(0.9), LIGHT)
    add_text(tip, "Facilitation: See → Own → Control → Govern → Prove  |  Keep demo to 12–15 minutes  |  End on the dashboard", 13, False, SLATE, PP_ALIGN.CENTER)

    footer(s, "14 Live Demo", page, TOTAL)
    notes(s, "Restate the flow in one breath before switching to the live system. Capture questions separately.")


def slide_decision(prs, page):
    s = blank_slide(prs)
    bar(s, NAVY)
    title_block(s, "15  Decision & Next Steps", "Convert alignment into sponsorship",
                "Key message: Governance improves when leadership chooses — and uses — one system")

    asks = [
        ("1", "Endorse the platform", "Confirm as the enterprise system of record for applications & licenses"),
        ("2", "Name accountable owners", "Business + IT owners for data quality, access, and license stewardship"),
        ("3", "Approve a 90-day value plan", "Baseline reporting effort, renewals at risk, and utilization — then track"),
    ]
    for i, (num, title, detail) in enumerate(asks):
        left = Inches(0.5 + i * 4.2)
        c = card(s, left, Inches(2.0), Inches(4.0), Inches(3.8))
        badge = s.shapes.add_shape(MSO_SHAPE.OVAL, left + Inches(1.5), Inches(2.35), Inches(1.0), Inches(1.0))
        badge.fill.solid()
        badge.fill.fore_color.rgb = ACCENT
        badge.line.fill.background()
        n = s.shapes.add_textbox(left + Inches(1.5), Inches(2.55), Inches(1.0), Inches(0.7))
        add_text(n, num, 22, True, WHITE, PP_ALIGN.CENTER)
        t = s.shapes.add_textbox(left + Inches(0.25), Inches(3.6), Inches(3.5), Inches(0.5))
        add_text(t, title, 15, True, NAVY, PP_ALIGN.CENTER)
        d = s.shapes.add_textbox(left + Inches(0.25), Inches(4.25), Inches(3.5), Inches(1.2))
        add_text(d, detail, 12, False, MUTED, PP_ALIGN.CENTER)

    footer(s, "15 Decision", page, TOTAL)
    notes(s, "Be explicit about the ask. Offer a one-page decision memo as follow-up.")


def slide_appendix(prs, page):
    s = blank_slide(prs)
    bar(s)
    title_block(s, "Appendix", "How we speak about the platform",
                "Key message: Language determines whether this is seen as admin software — or enterprise control")

    mappings = [
        ("CRUD modules", "Centralized Governance"),
        ("Users screen", "Identity Management"),
        ("Roles", "Access Governance"),
        ("SSO setup", "Enterprise Authentication"),
        ("Activity logs", "Compliance & Audit Evidence"),
        ("Dashboard", "Executive Decision Support"),
        ("License records", "Cost Optimization"),
        ("Application list", "Digital Asset Governance"),
    ]
    for i, (a, b) in enumerate(mappings):
        row, col = divmod(i, 2)
        left = Inches(0.5 + col * 6.4)
        top = Inches(1.7 + row * 1.15)
        c = card(s, left, top, Inches(6.2), Inches(1.0))
        left_t = s.shapes.add_textbox(left + Inches(0.25), top + Inches(0.3), Inches(2.4), Inches(0.4))
        add_text(left_t, a, 12, False, MUTED)
        mid = s.shapes.add_textbox(left + Inches(2.6), top + Inches(0.3), Inches(0.5), Inches(0.4))
        add_text(mid, "→", 14, True, ACCENT)
        right_t = s.shapes.add_textbox(left + Inches(3.1), top + Inches(0.3), Inches(2.9), Inches(0.4))
        add_text(right_t, b, 13, True, NAVY)

    footer(s, "Appendix", page, TOTAL)
    notes(s, "Optional leave-behind for presenters. Elevator pitch: single trusted view of apps, licenses, ownership, and access.")


def build():
    ASSETS.mkdir(parents=True, exist_ok=True)
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    slide_title(prs)
    page = 1
    builders = [
        slide_agenda,
        slide_exec_summary,
        slide_challenges,
        slide_impact,
        slide_solution,
        slide_capabilities,
        slide_benefits,
        slide_security,
        slide_executive_dashboard,
        slide_analytics,
        slide_roadmap,
        slide_roi,
        slide_screens_portfolio,
        slide_screens_governance,
        slide_demo,
        slide_decision,
        slide_appendix,
    ]
    # recount TOTAL dynamically
    global TOTAL
    TOTAL = 1 + len(builders)
    for i, fn in enumerate(builders, start=2):
        fn(prs, i)

    # Fix footers: regenerate is hard; TOTAL used at creation — rebuild with correct TOTAL from start
    # Actually first title has no footer; others used TOTAL=16 while we have 18 slides. Rebuild cleanly.

    prs.save(OUT)
    return OUT


if __name__ == "__main__":
    # Rebuild with accurate total
    ASSETS.mkdir(parents=True, exist_ok=True)
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    builders = [
        slide_title,
        slide_agenda,
        slide_exec_summary,
        slide_challenges,
        slide_impact,
        slide_solution,
        slide_capabilities,
        slide_benefits,
        slide_security,
        slide_executive_dashboard,
        slide_analytics,
        slide_roadmap,
        slide_roi,
        slide_screens_portfolio,
        slide_screens_governance,
        slide_demo,
        slide_decision,
        slide_appendix,
    ]
    TOTAL = len(builders)

    # Monkeypatch TOTAL into module for footer calls
    import sys
    mod = sys.modules[__name__]
    mod.TOTAL = TOTAL

    page = 0
    for fn in builders:
        page += 1
        if fn is slide_title:
            fn(prs)
        else:
            fn(prs, page)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    prs.save(str(OUT))
    print(f"Wrote {OUT} ({TOTAL} slides)")
