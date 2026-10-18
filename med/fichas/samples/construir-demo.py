#!/usr/bin/env python3
"""Genera los datos de ejemplo de MED Fichas (todo inventado, ningún dato real de MED).

Crea en samples/demo/: ilustraciones SVG de muestra, texturas, ficha de proveedor PDF,
tabla de tallas CSV y producto-demo.json; además samples/demo.js para cargarlo con un clic.
Uso: python3 samples/construir-demo.py   (requiere Pillow y reportlab)
"""
import base64, json, math, os, random
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'demo')
os.makedirs(OUT, exist_ok=True)
random.seed(7)

IVORY, TITANIUM, GRAPHITE, STEEL, TEAL = '#F8F7F4', '#C2CCD2', '#222223', '#5B7282', '#2E4A52'

# ---------- Ilustraciones (muestra; las reales las entrega Alan) ----------
# Torso tipo maniquí: orgánico, hombros suaves, sin brazos ni manos.
TORSO = ('M150 12 C163 12 170 20 171 34 C172 50 180 58 202 64 C230 72 249 84 254 104 '
         'C258 122 252 142 246 162 C240 196 236 236 228 274 C222 306 222 336 232 370 '
         'C242 404 247 440 242 476 L58 476 C53 440 58 404 68 370 C78 336 78 306 72 274 '
         'C64 236 60 196 54 162 C48 142 42 122 46 104 C51 84 70 72 98 64 C120 58 128 50 129 34 '
         'C130 20 137 12 150 12 Z')

def bra_front(stroke=TEAL):
    return f'''
  <path d="M74 236 C100 246 200 246 226 236 L224 262 C198 270 102 270 76 262 Z" fill="{IVORY}" stroke="{stroke}" stroke-width="1.1"/>
  <path d="M78 238 C74 206 88 176 116 170 C136 166 146 186 148 214 L148 244 C124 246 98 244 78 238 Z" fill="{IVORY}" stroke="{stroke}" stroke-width="1.1"/>
  <path d="M222 238 C226 206 212 176 184 170 C164 166 154 186 152 214 L152 244 C176 246 202 244 222 238 Z" fill="{IVORY}" stroke="{stroke}" stroke-width="1.1"/>
  <path d="M116 170 C112 132 108 100 106 68" fill="none" stroke="{IVORY}" stroke-width="7" stroke-linecap="round"/>
  <path d="M184 170 C188 132 192 100 194 68" fill="none" stroke="{IVORY}" stroke-width="7" stroke-linecap="round"/>
  <path d="M116 170 C112 132 108 100 106 68 M184 170 C188 132 192 100 194 68" fill="none" stroke="{stroke}" stroke-width="0.8" stroke-dasharray="2 2"/>
  <path d="M84 222 C104 230 128 232 146 230 M216 222 C196 230 172 232 154 230" fill="none" stroke="{stroke}" stroke-width="0.7" stroke-dasharray="2 2"/>
  <path d="M150 214 L150 262" stroke="{stroke}" stroke-width="1.1"/>
  <path d="M146 222 h8 M146 232 h8 M146 242 h8 M146 252 h8" stroke="{stroke}" stroke-width="0.9"/>'''

def bra_back(stroke=TEAL):
    return f'''
  <path d="M60 222 C100 232 200 232 240 222 L236 254 C200 262 100 262 64 254 Z" fill="{IVORY}" stroke="{stroke}" stroke-width="1.1"/>
  <path d="M106 68 C118 120 136 170 150 226 M194 68 C182 120 164 170 150 226" fill="none" stroke="{IVORY}" stroke-width="7" stroke-linecap="round"/>
  <path d="M106 68 C118 120 136 170 150 226 M194 68 C182 120 164 170 150 226" fill="none" stroke="{stroke}" stroke-width="0.8" stroke-dasharray="2 2"/>
  <path d="M66 238 C110 246 190 246 234 238" fill="none" stroke="{stroke}" stroke-width="0.7" stroke-dasharray="2 2"/>'''

def svg(body, w=300, h=480):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{body}\n</svg>\n'

open(os.path.join(OUT, 'figura-frente.svg'), 'w').write(svg(f'\n  <path d="{TORSO}" fill="{TITANIUM}"/>' + bra_front()))
open(os.path.join(OUT, 'figura-espalda.svg'), 'w').write(svg(f'\n  <path d="{TORSO}" fill="{TITANIUM}"/>' + bra_back()))
# Figura de tallas: solo contorno claro para poner las cintas encima
open(os.path.join(OUT, 'figura-tallas.svg'), 'w').write(svg(f'\n  <path d="{TORSO}" fill="none" stroke="{IVORY}" stroke-width="1.6"/>' +
    f'\n  <path d="M84 222 C96 176 132 168 148 214 M216 222 C204 176 168 168 152 214" fill="none" stroke="{IVORY}" stroke-width="1" stroke-opacity="0.7"/>'))
# Cómo medir: contorno con la cinta rodeando el bajo busto
open(os.path.join(OUT, 'como-medir.svg'), 'w').write(svg(f'''
  <path d="{TORSO}" fill="none" stroke="{IVORY}" stroke-width="1.6"/>
  <path d="M70 252 C110 268 190 268 230 252" fill="none" stroke="{IVORY}" stroke-width="3"/>
  <path d="M70 252 C110 240 190 240 230 252" fill="none" stroke="{IVORY}" stroke-width="1.2" stroke-dasharray="3 3"/>
  <path d="M84 222 C96 176 132 168 148 214 M216 222 C204 176 168 168 152 214" fill="none" stroke="{IVORY}" stroke-width="1" stroke-opacity="0.7"/>'''))
# Rayos X: estructura interna en líneas claras sobre fondo transparente (el panel es Graphite)
xr = [f'<path d="{TORSO}" fill="none" stroke="{TITANIUM}" stroke-opacity="0.35" stroke-width="1.2"/>']
for k in range(9):
    y = 238 + k * 3
    xr.append(f'<path d="M{76 + k*0.3} {y} C110 {y+9} 190 {y+9} {224 - k*0.3} {y}" fill="none" stroke="{IVORY}" stroke-opacity="{0.25 + k*0.05:.2f}" stroke-width="0.6"/>')
for side in (1, -1):
    for k in range(6):
        r = 30 - k * 4
        cx = 150 - side * 34
        xr.append(f'<ellipse cx="{cx}" cy="{214 - k}" rx="{r + 6}" ry="{r}" fill="none" stroke="{IVORY}" stroke-opacity="{0.3 + k*0.1:.2f}" stroke-width="0.6"/>')
xr.append(f'<path d="M150 210 L150 266" stroke="{IVORY}" stroke-width="1.4"/>')
xr.append(f'<path d="M116 170 C112 132 108 100 106 68 M184 170 C188 132 192 100 194 68" fill="none" stroke="{IVORY}" stroke-width="1"/>')
open(os.path.join(OUT, 'rayos-x.svg'), 'w').write(svg('\n  ' + '\n  '.join(xr)))

# ---------- Texturas (fotos simuladas) ----------
def texture(name, kind, size=1400):
    im = Image.new('L', (size, size))
    px = im.load()
    for y in range(size):
        for x in range(size):
            if kind == 'rib':
                v = 0.55 + 0.32 * math.sin(x * 2 * math.pi / 14) * (0.8 + 0.2 * math.sin(y * 2 * math.pi / 40))
            elif kind == 'mesh':
                gx, gy = (x % 26) - 13, (y % 26) - 13
                if (y // 26) % 2: gx = ((x + 13) % 26) - 13
                v = 0.25 if gx * gx + gy * gy < 50 else 0.75 + 0.1 * math.sin(x / 3)
            else:
                v = 0.62 + 0.18 * math.sin(x / 9 + math.sin(y / 11)) * math.cos(y / 13)
            px[x, y] = max(0, min(255, int(v * 255 + random.uniform(-14, 14))))
    im = im.filter(ImageFilter.GaussianBlur(1.1 if kind != 'plush' else 2.2))
    tint = {'rib': (196, 202, 204), 'mesh': (214, 214, 210), 'plush': (226, 220, 210)}[kind]
    rgb = Image.merge('RGB', [im.point(lambda v, c=c: int(v * c / 255)) for c in tint])
    rgb.save(os.path.join(OUT, name), quality=88)

texture('textura-flexweave.jpg', 'rib')
texture('textura-malla.jpg', 'mesh')
texture('textura-felpa.jpg', 'plush')

# ---------- Tabla de tallas (CSV) ----------
open(os.path.join(OUT, 'tallas-demo.csv'), 'w').write(
    'Medida;XS;S;M;L;XL;2XL\n'
    'Contorno bajo busto;63–67;68–72;73–77;78–82;83–87;88–92\n'
    'Contorno de busto;78–82;83–87;88–92;93–97;98–102;103–107\n'
    'Contorno de cintura;60–64;65–69;70–74;75–79;80–84;85–89\n')

# ---------- Producto de ejemplo (JSON) ----------
producto = {
  "esquema": "med.ficha.v1", "idioma": "es", "linea": "clinical",
  "modulos": ["cover", "materials", "sizes"],
  "producto": {
    "nombre": "CONTOURA™ BRA", "referencia": "9001",
    "categoria": "Brasier de compresión post-quirúrgico",
    "bajada": "Soporte anatómico continuo para cada etapa de la recuperación.",
    "descripcion": "Diseñado para acompañar la recuperación después de procedimientos de busto. Su banda inferior distribuye la compresión de forma uniforme, mientras las copas sin costuras evitan puntos de presión sobre zonas sensibles. El cierre frontal facilita ponerlo y quitarlo sin levantar los brazos.",
    "url": "https://example.com/productos/9001"
  },
  "cobertura": {
    "figuras": [{"imagen": "figura-frente.svg", "vista": "Frente", "recorte": {"arriba": 0, "abajo": 0.62}}, {"imagen": "figura-espalda.svg", "vista": "Espalda", "recorte": {"arriba": 0, "abajo": 0.62}}],
    "zonas": [
      {"nombre": "Tirantes acolchados", "texto": "Reparten la carga sobre los hombros.", "figura": 0, "x": 0.3, "y": 0.2},
      {"nombre": "Copas sin costuras", "texto": "Contacto suave sin puntos de presión.", "figura": 0, "x": 0.3, "y": 0.42},
      {"nombre": "Banda inferior de soporte", "texto": "Compresión uniforme bajo el busto.", "figura": 0, "x": 0.22, "y": 0.52},
      {"nombre": "Cierre frontal", "texto": "Ganchos en tres posiciones.", "figura": 0, "x": 0.5, "y": 0.5},
      {"nombre": "Espalda cruzada", "texto": "Estabiliza la postura durante el día.", "figura": 1, "x": 0.62, "y": 0.3},
      {"nombre": "Banda posterior", "texto": "Mantiene la prenda en su lugar.", "figura": 1, "x": 0.76, "y": 0.5}
    ]
  },
  "materiales": {
    "lista": [
      {"nombre": "FLEXWEAVE™", "principal": True, "textura": "textura-flexweave.jpg",
       "composicion": [{"fibra": "Poliamida", "pct": 72}, {"fibra": "Elastano", "pct": 28}],
       "descripcion": "Tejido de punto de compresión con elasticidad en cuatro direcciones. Mantiene la presión estable a lo largo del día y recupera su forma después de cada lavado.",
       "propiedades": ["Compresión media uniforme", "Secado rápido", "Recuperación elástica"]},
      {"nombre": "Malla Respira", "principal": False, "textura": "textura-malla.jpg",
       "composicion": [{"fibra": "Poliéster", "pct": 85}, {"fibra": "Elastano", "pct": 15}],
       "descripcion": "Paneles de ventilación en la espalda.", "propiedades": []},
      {"nombre": "Felpa interior", "principal": False, "textura": "textura-felpa.jpg",
       "composicion": [{"fibra": "Algodón", "pct": 90}, {"fibra": "Elastano", "pct": 10}],
       "descripcion": "Forro suave en contacto con la piel.", "propiedades": []}
    ],
    "rayos_x": "rayos-x.svg",
    "rayos_x_nota": "Capas de la banda inferior y de las copas vistas en transparencia."
  },
  "tallas": {
    "unidad": "cm", "tallas": ["XS", "S", "M", "L", "XL", "2XL"],
    "medidas": [
      {"nombre": "Contorno bajo busto", "valores": ["63–67", "68–72", "73–77", "78–82", "83–87", "88–92"], "cinta": {"y": 0.535, "x1": 0.08, "x2": 0.92}},
      {"nombre": "Contorno de busto", "valores": ["78–82", "83–87", "88–92", "93–97", "98–102", "103–107"], "cinta": {"y": 0.43, "x1": 0.1, "x2": 0.9}},
      {"nombre": "Contorno de cintura", "valores": ["60–64", "65–69", "70–74", "75–79", "80–84", "85–89"], "cinta": {"y": 0.66, "x1": 0.2, "x2": 0.8}}
    ],
    "figura": "figura-tallas.svg",
    "nota": "Si tus medidas quedan entre dos tallas, elige la talla según el contorno bajo busto.",
    "como_medir": {
      "ilustracion": "como-medir.svg",
      "pasos": ["Usa una cinta métrica flexible, sin apretar, y mide sobre la piel o sobre ropa delgada.",
                "Rodea el torso justo debajo del busto, con la cinta paralela al piso.",
                "Mide el contorno de busto en la parte más prominente, con los brazos relajados."]
    }
  },
  "imagenes": {}, "revisar": []
}
json.dump(producto, open(os.path.join(OUT, 'producto-demo.json'), 'w'), ensure_ascii=False, indent=2)

# ---------- Ficha de proveedor de ejemplo (PDF) para probar la extracción ----------
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
c = canvas.Canvas(os.path.join(OUT, 'ficha-proveedor-demo.pdf'), pagesize=A4)
W, H = A4
y = H - 60
def t(txt, size=10, bold=False, dy=None):
    global y
    c.setFont('Helvetica-Bold' if bold else 'Helvetica', size); c.drawString(50, y, txt); y -= dy or size * 1.5
t('TEXTILES DEMO S.A.S. · Ficha técnica de producto', 8)
y -= 10
t('CONTOURA™ BRA', 22, True, 28)
t('Ref. 9001', 11)
t('Brasier de compresión post-quirúrgico', 10, dy=26)
t('DESCRIPCIÓN', 11, True)
for l in ['Diseñado para acompañar la recuperación después de procedimientos de busto. Su banda inferior',
          'distribuye la compresión de forma uniforme, mientras las copas sin costuras evitan puntos de',
          'presión sobre zonas sensibles. El cierre frontal facilita ponerlo y quitarlo sin levantar los brazos.']:
    t(l, 9.5, dy=13)
y -= 10
t('CARACTERÍSTICAS', 11, True)
for l in ['• Tirantes acolchados: reparten la carga sobre los hombros.', '• Copas sin costuras: contacto suave sin puntos de presión.',
          '• Banda inferior de soporte: compresión uniforme bajo el busto.', '• Cierre frontal: ganchos en tres posiciones.']:
    t(l, 9.5, dy=13)
y -= 10
t('COMPOSICIÓN', 11, True)
for l in ['Tejido principal FLEXWEAVE™: 72% Poliamida, 28% Elastano', 'Malla Respira: 85% Poliéster, 15% Elastano', 'Felpa interior: 90% Algodón, 10% Elastano']:
    t(l, 9.5, dy=13)
y -= 10
t('TABLA DE TALLAS (cm)', 11, True)
rows = [['Talla', 'XS', 'S', 'M', 'L', 'XL', '2XL'], ['Contorno bajo busto', '63-67', '68-72', '73-77', '78-82', '83-87', '88-92'],
        ['Contorno de busto', '78-82', '83-87', '88-92', '93-97', '98-102', '103-107']]
for r in rows:
    c.setFont('Helvetica', 9); c.drawString(50, y, r[0])
    for i, v in enumerate(r[1:]): c.drawString(190 + i * 52, y, v)
    y -= 14
y -= 10
t('CUIDADOS', 11, True)
t('Lavar a mano con agua fría. No usar blanqueador. Secar a la sombra.', 9.5)
c.setFont('Helvetica', 7); c.drawString(50, 30, 'Documento de ejemplo · datos ficticios')
c.save()

# ---------- demo.js: el producto con sus imágenes embebidas (carga con un clic, sin red) ----------
def data_url(fn):
    ext = fn.rsplit('.', 1)[1]
    mime = {'svg': 'image/svg+xml', 'jpg': 'image/jpeg', 'png': 'image/png'}[ext]
    raw = open(os.path.join(OUT, fn), 'rb').read()
    entry = {"nombre": fn, "tipo": mime, "src": f"data:{mime};base64," + base64.b64encode(raw).decode()}
    if ext != 'svg':
        w, h = Image.open(os.path.join(OUT, fn)).size
        entry.update(ancho=w, alto=h)
    else:
        import re
        vb = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', raw.decode()).groups()
        entry.update(ancho=float(vb[0]), alto=float(vb[1]))
    return entry
full = json.loads(json.dumps(producto))
for fn in sorted(os.listdir(OUT)):
    if fn.rsplit('.', 1)[-1] in ('svg', 'jpg', 'png'):
        full['imagenes'][fn] = data_url(fn)
open(os.path.join(HERE, 'demo.js'), 'w').write('/* Generado por construir-demo.py · datos ficticios */\nwindow.MED_DEMO = ' + json.dumps(full, ensure_ascii=False) + ';\n')
print('Ejemplo generado en', OUT)
