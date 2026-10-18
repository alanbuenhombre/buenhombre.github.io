#!/usr/bin/env python3
"""PDF guía de EJEMPLO con datos 100 % ficticios, en la misma plantilla genérica de ficha
técnica MED (7 páginas, rótulos en negrita, valores en serif). Sirve para pruebas y demo.
Uso: python3 tools/generar-guia-ejemplo.py ejemplos/guia-ficticia.pdf   (requiere reportlab y Pillow)
"""
import io, math, os, sys
from PIL import Image, ImageDraw, ImageFilter
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

OUT = sys.argv[1] if len(sys.argv) > 1 else 'ejemplos/guia-ficticia.pdf'
os.makedirs(os.path.dirname(OUT) or '.', exist_ok=True)
W, H = letter
TEAL = (0.06, 0.29, 0.31)
GOLD = (0.76, 0.56, 0.24)
INK = (0.13, 0.13, 0.14)
PRODUCT = 'CONTOURA™ BRA'
REF = '9001'

def foto(w, h, tono=(206, 186, 168), persona=True, seed=1):
    im = Image.new('RGB', (w, h), (236, 234, 229))
    d = ImageDraw.Draw(im)
    if persona:
        cx = w // 2
        d.ellipse([cx - w * .12, h * .08, cx + w * .12, h * .30], fill=(214, 190, 170))      # cabeza
        d.rectangle([cx - w * .06, h * .28, cx + w * .06, h * .36], fill=(214, 190, 170))    # cuello
        d.rounded_rectangle([cx - w * .38, h * .34, cx + w * .38, h * 1.1], 60, fill=(214, 190, 170))
        d.rounded_rectangle([cx - w * .34, h * .46, cx + w * .34, h * .74], 30, fill=tono)    # prenda
    else:
        for i in range(0, w, 14):
            d.line([(i, 0), (i + h // 3, h)], fill=tono, width=6)
    return im.filter(ImageFilter.GaussianBlur(1))

def img(c, im, x, y, w, h):
    b = io.BytesIO(); im.save(b, 'JPEG', quality=85); b.seek(0)
    c.drawImage(ImageReader(b), x, H - y - h, w, h)

def t(c, x, y, s, size=8, font='Helvetica', color=INK):
    c.setFillColorRGB(*color); c.setFont(font, size); c.drawString(x, H - y, s)

def tr(c, x, y, s, size=8, font='Helvetica-Bold', color=INK):
    c.setFillColorRGB(*color); c.setFont(font, size); c.drawRightString(x, H - y, s)

def para(c, x, y, lines, size=6.5, lead=8, font='Helvetica', color=INK):
    for i, l in enumerate(lines): t(c, x, y + i * lead, l, size, font, color)

def page(c, n, seccion):
    c.setFillColorRGB(*TEAL); c.rect(25, H - 60, 562, 40, fill=1, stroke=0)
    t(c, 31, 42, 'MED', 22, 'Times-Bold', (0.8, 0.65, 0.35))
    t(c, 91, 42, 'SCIENCE & INNOVATION SYSTEMS™', 10, 'Helvetica-Bold', (1, 1, 1))
    t(c, 31, 56, 'MED CLINICAL COMPRESSION SYSTEM™', 8, 'Helvetica', (1, 1, 1))
    tr(c, 580, 39, seccion, 7.5, 'Helvetica-Bold', (1, 1, 1))
    tr(c, 580, 48, '%s · REF. %s · %02d' % (PRODUCT, REF, n), 8, 'Helvetica-Bold', GOLD)
    t(c, 30, 767, 'SCIENCE. TECHNOLOGY. EVIDENCE.', 7, 'Helvetica-Bold', TEAL)
    t(c, 256, 767, 'MED SCIENCE SYSTEMS INC.', 7)
    t(c, 553, 767, 'PAGE %02d' % n, 7, 'Helvetica-Bold', GOLD)

def title(c, eyebrow, h1, ent):
    t(c, 25, 82, eyebrow, 8.5, 'Helvetica-Bold', GOLD)
    t(c, 25, 102, h1, 21, 'Times-Roman', TEAL)
    para(c, 25, 116, ent, 9)

c = canvas.Canvas(OUT, pagesize=letter)
# ---- 01
page(c, 1, 'PRODUCT TECHNICAL SHEET')
for i, (v, l) in enumerate([('MED SCIENCE SYSTEMS', 'CORPORATION'), ('MED SCIENCE &', 'BRAND'), ('MED CLINICAL', 'SYSTEM'), ('POST-OP SYSTEMS', 'PRODUCT LINE'), (PRODUCT, 'PRODUCT'), ('REF. ' + REF, 'REFERENCE')]):
    t(c, 27 + i * 94, 82, v, 6.5, 'Helvetica-Bold', TEAL); t(c, 27 + i * 94, 90, l, 5.5)
t(c, 25, 115, 'Ref. %s · %s · Product Technical Sheet' % (REF, PRODUCT), 19.5, 'Times-Roman', TEAL)
t(c, 25, 128, 'Demonstration Compression Bra with Front Closure and Soft Support Band', 9)
img(c, foto(600, 930), 45, 140, 195, 300); img(c, foto(600, 930, seed=2), 250, 140, 185, 300)
t(c, 445, 146, 'ANATOMICAL COVERAGE', 8, 'Helvetica-Bold', GOLD)
t(c, 445, 159, 'PRIMARY COVERAGE', 6.5, 'Helvetica-Bold', TEAL); t(c, 445, 168, 'Thoracic Region', 10.5, 'Times-Roman', TEAL)
t(c, 445, 177, 'Demonstration support territory for testing.', 6.5)
t(c, 445, 190, 'SECONDARY COVERAGE', 6.5, 'Helvetica-Bold', TEAL); t(c, 445, 199, 'Upper Back Region', 10.5, 'Times-Roman', TEAL)
t(c, 445, 208, 'Example coverage text for the secondary region.', 6.5)
t(c, 445, 230, 'PRODUCT CONFIGURATION', 7.5, 'Helvetica-Bold', GOLD)
t(c, 445, 240, 'AVAILABLE SIZES', 6.5, 'Helvetica-Bold', TEAL); t(c, 445, 249, 'XS-3XL', 11, 'Times-Roman', TEAL)
t(c, 445, 262, 'AVAILABLE COLORS', 6.5, 'Helvetica-Bold', TEAL); t(c, 445, 273, 'Beige · Black', 9, 'Helvetica-Bold')
t(c, 29, 456, 'PRODUCT OVERVIEW', 8, 'Helvetica-Bold', GOLD)
para(c, 25, 476, ['%s is a fictitious garment created only to test the layout tool. It describes a front closure,' % PRODUCT,
                  'a soft support band and breathable panels. None of this text belongs to a real product.'], 8, 10)
for i, (h, d) in enumerate([('EVEN SUPPORT', ['Example benefit text', 'for the first column.']), ('SOFT CONTACT', ['Example benefit text', 'for the second column.']),
                            ('STABLE BAND', ['Example benefit text', 'for the third column.']), ('EASY CLOSURE', ['Example benefit text', 'for the fourth column.'])]):
    t(c, 40 + i * 140, 520, h, 8, 'Helvetica-Bold', TEAL); para(c, 40 + i * 140, 531, d, 6, 8)
c.showPage()
# ---- 02
page(c, 2, 'TECHNOLOGY & MATERIAL INTELLIGENCE')
t(c, 25, 82, 'MED SCIENCE MATERIAL INTELLIGENCE™', 8.5, 'Helvetica-Bold', GOLD)
t(c, 25, 105, 'FLEXWEAVE™', 26, 'Times-Roman', TEAL)
t(c, 25, 120, 'DEMO TECHNOLOGY · Built for Testing. Designed to Demonstrate.', 9)
comp = Image.new('RGB', (1800, 1020), (244, 240, 233))
for i in range(3): comp.paste(foto(560, 270, (190, 170, 150), persona=False), (70 + i * 570, 200))
img(c, comp, 30, 132, 552, 312)
t(c, 28, 454, 'SYSTEM LOGIC', 6.5, 'Helvetica-Bold', GOLD); t(c, 141, 455, 'Fiber choice -> panel placement -> garment assembly -> finished-product behavior.', 7)
t(c, 28, 470, 'SCIENTIFIC BOUNDARY', 6.5, 'Helvetica-Bold', GOLD); t(c, 141, 471, 'Example boundary statement for the demonstration garment.', 7)
t(c, 25, 492, 'MATERIAL ARCHITECTURE', 8, 'Helvetica-Bold', GOLD)
for i, (n, d) in enumerate([('MICROMESH', ['Open demo mesh that gives structure', 'to the example garment.']), ('SOFTKNIT', ['Soft demo knit placed on the', 'body-facing side.']), ('AIRFOAM', ['Light demo foam used only in', 'documented example zones.'])]):
    t(c, 28 + i * 188, 519, n, 7, 'Helvetica-Bold', TEAL); para(c, 28 + i * 188, 528, d, 6, 8)
t(c, 185, 565, 'Three demo materials. One example structure.', 9.5, 'Times-Roman', GOLD)
c.showPage()
# ---- 03
page(c, 3, 'PRODUCT ENGINEERING · STRUCTURAL ARCHITECTURE')
title(c, 'ENGINEERING VIEW', 'ENGINEERED FOR THE DEMO BODY', ['Construction is described here only to test the reading rules.'])
img(c, foto(1900, 1050), 30, 130, 552, 300)
t(c, 25, 440, '*Callout locations are illustrative for this fictitious example.', 6, 'Helvetica-Oblique')
t(c, 25, 452, 'ENGINEERED DETAIL VIEWS', 8, 'Helvetica-Bold', GOLD)
for i, (h, d) in enumerate([('FRONT CLOSURE', 'Example hook closure detail.'), ('SIDE PANEL', 'Example side construction.'), ('BAND EDGE', 'Example lower band finish.'), ('BACK PANEL', 'Example back construction.')]):
    img(c, foto(240, 270, persona=False, seed=i), 40 + i * 140, 462, 80, 60)
    t(c, 40 + i * 140, 534, h, 6.5, 'Helvetica-Bold', GOLD); t(c, 40 + i * 140, 542, d, 5.5)
t(c, 25, 566, 'ENGINEERED PRODUCT FEATURES', 8, 'Helvetica-Bold', GOLD)
feats = [('01 · SOFT CUPS', 'Example feature text number one.'), ('02 · WIDE STRAPS', 'Example feature text number two.'), ('03 · BREATHABLE PANELS', 'Example feature text number three.'),
         ('04 · BACK SUPPORT', 'Example feature text number four.'), ('05 · FRONT CLOSURE', 'Example feature text number five.'), ('06 · STABLE BAND', 'Example feature text number six.')]
for i, (h, d) in enumerate(feats):
    x, y = 28 + (i % 3) * 188, 590 + (i // 3) * 32
    t(c, x, y, h, 6, 'Helvetica-Bold', TEAL); t(c, x, y + 7, d, 5.5)
c.showPage()
# ---- 04
page(c, 4, 'COMPONENT ENGINEERING · MATERIAL CREDENTIALS')
title(c, 'STRUCTURAL COMPONENT MAPPING', 'ENGINEERED PANEL INTEGRATION', ['Example panels are placed only in documented demo zones.'])
img(c, foto(1800, 1120), 30, 132, 552, 340)
t(c, 29, 490, 'PRODUCT CONSTRUCTION · COMPONENT', 8, 'Helvetica-Bold', GOLD); t(c, 29, 499, 'RELATIONSHIP', 8, 'Helvetica-Bold', GOLD)
for i, (h, d) in enumerate([('CUP ARCHITECTURE', 'Example cup relationship text.'), ('STRAP ARCHITECTURE', 'Example strap relationship text.'), ('BACK ARCHITECTURE', 'Example back relationship text.'),
                            ('FRONT ADJUSTMENT', 'Example closure relationship text.'), ('LOWER INTERFACE', 'Example band relationship text.'), ('PANEL REINFORCEMENT', 'Example panel relationship text.')]):
    x, y = 32 + (i % 2) * 277, 514 + (i // 2) * 21
    t(c, x, y, h, 6.5, 'Helvetica-Bold', GOLD); t(c, x, y + 8, d, 6)
t(c, 29, 589, 'MATERIAL CREDENTIALS', 8, 'Helvetica-Bold', GOLD)
t(c, 32, 616, 'DEMO FIBER', 8, 'Helvetica-Bold', TEAL); para(c, 32, 626, ['Example credential text for a fictitious fiber.'], 6.5)
t(c, 310, 616, 'DEMO STANDARD 100', 8, 'Helvetica-Bold', TEAL); para(c, 310, 626, ['Example credential text for a fictitious standard.'], 6.5)
t(c, 32, 656, 'MATERIAL SYSTEM', 7, 'Helvetica-Bold', GOLD); t(c, 231, 656, 'Textile Materials: Micromesh + Softknit | Localized Component: Airfoam', 6.5)
c.showPage()
# ---- 05
page(c, 5, 'PROFESSIONAL USE · SIZE & MEASUREMENT')
title(c, 'PROFESSIONAL USE', 'PROFESSIONAL USE & MEASUREMENT GUIDE', ['Product selection, measurement and fit guidance for the demo.'])
t(c, 27, 129, 'INTENDED PROFESSIONAL USE', 7, 'Helvetica-Bold', GOLD); para(c, 27, 139, ['Example intended-use text written', 'only for this fictitious document.'], 6.5)
t(c, 27, 176, 'POTENTIAL PROFESSIONAL APPLICATIONS', 7, 'Helvetica-Bold', GOLD)
para(c, 27, 186, ['• Example application one', '• Example application two', '• Example application three'], 6.5)
para(c, 27, 214, ['Final use is decided by the treating professional', '(example note).'], 6)
img(c, foto(634, 984), 260, 130, 140, 220); img(c, foto(634, 984, seed=3), 410, 130, 140, 220)
t(c, 278, 365, 'FRONT VIEW', 6.5, 'Helvetica-Bold', GOLD); t(c, 418, 365, 'POSTERIOR COVERAGE · REFERENCE VIEW', 6.5, 'Helvetica-Bold', GOLD)
t(c, 25, 377, 'SIZE & FIT', 8, 'Helvetica-Bold', GOLD)
t(c, 27, 401, 'AVAILABLE SIZES', 7, 'Helvetica-Bold', GOLD); t(c, 27, 413, 'XS · S · M · L · XL · 2XL · 3XL', 9.5, 'Helvetica-Bold', TEAL)
t(c, 215, 401, 'AVAILABLE COLORS', 7, 'Helvetica-Bold', GOLD); t(c, 215, 413, 'Beige · Black', 9.5, 'Helvetica-Bold', TEAL)
t(c, 403, 401, 'PATIENT MEASUREMENTS', 7, 'Helvetica-Bold', GOLD); t(c, 403, 413, 'Bust · Underbust · Waist', 9.5, 'Helvetica-Bold', TEAL)
t(c, 88, 423, 'SIZE', 6.5, 'Helvetica-Bold', (1, 1, 1))
for j, col in enumerate(['WAIST (in / cm)', 'BUST (in / cm)', 'UNDERBUST (in / cm)']): t(c, 208 + j * 145, 422, col, 5.5, 'Helvetica-Bold', (1, 1, 1))
rows = [('XS', '24-26', '61.0-66.0', '30-32', '76.2-81.3', '26-28', '66.0-71.1'), ('S', '26-28', '66.0-71.1', '32-34', '81.3-86.4', '28-30', '71.1-76.2'),
        ('M', '28-30', '71.1-76.2', '34-36', '86.4-91.4', '30-32', '76.2-81.3'), ('L', '30-32', '76.2-81.3', '36-38', '91.4-96.5', '32-34', '81.3-86.4'),
        ('XL', '32-34', '81.3-86.4', '38-40', '96.5-101.6', '34-36', '86.4-91.4'), ('2XL', '34-36', '86.4-91.4', '40-42', '101.6-106.7', '36-38', '91.4-96.5'),
        ('3XL', '36-38', '91.4-96.5', '42-44', '106.7-111.8', '38-40', '96.5-101.6')]
for i, r in enumerate(rows):
    y = 431 + i * 12.5
    t(c, 91, y, r[0], 6, 'Helvetica-Bold')
    for j in range(3): t(c, 225 + j * 145, y, r[1 + j * 2], 5.5); t(c, 223 + j * 145, y + 5, r[2 + j * 2], 5.5)
t(c, 25, 525, 'Example note below the size table: values are fictitious and for testing only.', 5)
t(c, 25, 540, 'HOW TO MEASURE', 8, 'Helvetica-Bold', GOLD)
for i, (h, d) in enumerate([('01 BUST', 'Example bust measuring instruction.'), ('02 UNDERBUST', 'Example underbust measuring instruction.'), ('03 WAIST', 'Example waist measuring instruction.')]):
    t(c, 27 + i * 187, 610, h, 6.5, 'Helvetica-Bold', TEAL); t(c, 27 + i * 187, 616, d, 5)
c.showPage()
# ---- 06
page(c, 6, 'PROFESSIONAL FITTING · PRODUCT CARE')
title(c, 'PROFESSIONAL FITTING', 'PROFESSIONAL FITTING & PRODUCT CARE', ['Example fitting guidance for the fictitious garment.'])
t(c, 29, 128, 'HOW TO WEAR · PROFESSIONAL FITTING', 8, 'Helvetica-Bold', GOLD); t(c, 29, 138, 'SEQUENCE', 8, 'Helvetica-Bold', GOLD)
for i, (n, h, d) in enumerate([('01', 'PREPARE', 'Example step one.'), ('02', 'POSITION', 'Example step two.'), ('03', 'ALIGN', 'Example step three.'), ('04', 'ADJUST', 'Example step four.'), ('05', 'VERIFY', 'Example step five.')]):
    x = 40 + i * 110
    t(c, x + 12, 165, n, 14, 'Times-Roman', GOLD); t(c, x, 177, h, 7.5, 'Helvetica-Bold', TEAL)
    img(c, foto(118, 216, persona=False, seed=i + 5), x, 185, 70, 45); t(c, x - 5, 241, d, 5.5)
t(c, 32, 270, 'PROFESSIONAL FIT CHECK', 7, 'Helvetica-Bold', GOLD)
para(c, 32, 280, ['• Example fit check one.', '• Example fit check two.', '• Example fit check three.'], 6.5)
t(c, 310, 270, 'KEY PRECAUTIONS', 7, 'Helvetica-Bold', GOLD)
para(c, 310, 280, ['• Example precaution one.', '• Example precaution two.'], 6.5)
t(c, 32, 330, 'PRODUCT CARE & MATERIAL INTEGRITY', 8, 'Helvetica-Bold', GOLD)
img(c, Image.new('RGB', (1800, 225), (20, 70, 78)), 32, 340, 550, 70)
t(c, 32, 425, 'CARE METHOD', 7, 'Helvetica-Bold', GOLD); t(c, 32, 435, 'Example care method text.', 6.5)
t(c, 310, 425, 'MATERIAL PROTECTION', 7, 'Helvetica-Bold', GOLD); t(c, 310, 435, 'Example material protection text.', 6.5)
c.showPage()
# ---- 07
page(c, 7, 'REGULATORY · QUALITY · PROFESSIONAL USE')
title(c, 'REGULATORY & QUALITY INFORMATION', 'REGULATORY, QUALITY & PROFESSIONAL USE', ['Example regulatory context for a fictitious product.'])
t(c, 32, 145, 'REGULATORY CONTEXT · EXAMPLE', 7.5, 'Helvetica-Bold', GOLD); t(c, 32, 165, 'CLASS I', 14, 'Times-Roman', (0.1, 0.1, 0.1))
t(c, 32, 181, 'Medical Device', 7); t(c, 32, 199, 'DEMO · FAMILY REGISTRATION 0000XX-0000000', 7)
t(c, 220, 145, 'QUALITY SYSTEM CREDENTIALS', 7.5, 'Helvetica-Bold', GOLD); t(c, 220, 162, 'ISO 00000:0000', 13, 'Times-Roman', (0.1, 0.1, 0.1))
t(c, 220, 173, 'Example Quality Management System', 7); t(c, 220, 194, 'Applicable example scope.', 7)
t(c, 410, 145, 'PRODUCT STATUS', 7.5, 'Helvetica-Bold', GOLD); t(c, 410, 165, 'NON-STERILE', 14, 'Times-Roman', (0.1, 0.1, 0.1)); t(c, 410, 181, 'EXTERNAL · NON-INVASIVE', 7)
t(c, 25, 233, 'FINISHED-PRODUCT PERFORMANCE · PROFESSIONAL USE', 8, 'Helvetica-Bold', GOLD)
t(c, 32, 256, 'FINISHED-PRODUCT PERFORMANCE', 8.5, 'Helvetica-Bold', GOLD); para(c, 32, 270, ['Example performance statement for the demo.'], 7)
t(c, 310, 256, 'PROFESSIONAL USE NOTE', 8.5, 'Helvetica-Bold', GOLD); para(c, 310, 270, ['Example professional use note for the demo.'], 7)
c.showPage()
c.save()
print('PDF guía ficticio:', OUT)
