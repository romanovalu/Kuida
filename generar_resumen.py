from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER

# ── Colores ──────────────────────────────────────────────────────────────────
CYAN      = colors.HexColor('#0CCEDD')
DARK      = colors.HexColor('#0D1117')
DARK2     = colors.HexColor('#161C26')
CYAN_LIGHT= colors.HexColor('#E6F9FB')
CYAN_DARK = colors.HexColor('#09A8B8')
GRAY      = colors.HexColor('#6B7280')
GRAY_LIGHT= colors.HexColor('#F3F4F6')
WHITE     = colors.white

OUT = r'C:\Users\roman\.claude\turnos-app\GestionTurnos_Resumen.pdf'

doc = SimpleDocTemplate(
    OUT, pagesize=A4,
    leftMargin=2*cm, rightMargin=2*cm,
    topMargin=2*cm, bottomMargin=2*cm,
    title='GestiónTurnos — Resumen de la app',
    author='GestiónTurnos',
)

styles = getSampleStyleSheet()

def S(name, **kw):
    return ParagraphStyle(name, **kw)

sTitle = S('sTitle', fontSize=26, leading=32, textColor=WHITE,
           fontName='Helvetica-Bold', spaceAfter=4)
sSub   = S('sSub',   fontSize=11, leading=14, textColor=CYAN,
           fontName='Helvetica-Bold', spaceAfter=0)
sH1    = S('sH1',    fontSize=13, leading=17, textColor=DARK,
           fontName='Helvetica-Bold', spaceBefore=14, spaceAfter=4)
sH2    = S('sH2',    fontSize=10.5, leading=14, textColor=CYAN_DARK,
           fontName='Helvetica-Bold', spaceBefore=8, spaceAfter=3)
sBody  = S('sBody',  fontSize=9.5, leading=14, textColor=colors.HexColor('#374151'),
           fontName='Helvetica', spaceAfter=4)
sBullet= S('sBullet',fontSize=9.5, leading=13, textColor=colors.HexColor('#374151'),
           fontName='Helvetica', leftIndent=14, spaceAfter=2)
sSmall = S('sSmall', fontSize=8.5, leading=12, textColor=GRAY,
           fontName='Helvetica', spaceAfter=2)
sFooter= S('sFooter',fontSize=8, leading=10, textColor=GRAY,
           fontName='Helvetica', alignment=TA_CENTER)
sTag   = S('sTag',   fontSize=8.5, leading=11, textColor=CYAN_DARK,
           fontName='Helvetica-Bold')

def hr(color=CYAN_LIGHT, thickness=1):
    return HRFlowable(width='100%', thickness=thickness, color=color, spaceAfter=6, spaceBefore=2)

def bullet(text):
    return Paragraph(f'<bullet>&bull;</bullet> {text}', sBullet)

def section_title(text):
    return KeepTogether([
        Spacer(1, 4),
        Paragraph(text, sH1),
        HRFlowable(width='100%', thickness=1.5, color=CYAN, spaceAfter=6, spaceBefore=0),
    ])

story = []

# ── PORTADA (header block) ────────────────────────────────────────────────────
header_data = [[
    Paragraph('GestiónTurnos', sTitle),
    ''
],[
    Paragraph('Agenda profesional · 100% local · Sin servidores', sSub),
    ''
]]
header_table = Table(header_data, colWidths=[14*cm, 3*cm])
header_table.setStyle(TableStyle([
    ('BACKGROUND',  (0,0), (-1,-1), DARK),
    ('BOTTOMPADDING',(0,0),(-1,-1), 16),
    ('TOPPADDING',  (0,0), (-1,-1), 18),
    ('LEFTPADDING', (0,0), (-1,-1), 20),
    ('RIGHTPADDING',(0,0), (-1,-1), 20),
    ('ROUNDEDCORNERS', [10]),
]))
story.append(header_table)
story.append(Spacer(1, 16))

# Intro
story.append(Paragraph(
    'Aplicación de gestión de turnos, pacientes y finanzas para profesionales independientes. '
    'Funciona como un único archivo HTML en tu dispositivo — sin internet, sin instalación, sin cuentas.',
    sBody
))
story.append(Spacer(1, 8))

# ── PRIMEROS PASOS ────────────────────────────────────────────────────────────
story.append(section_title('Primeros pasos'))
story.append(Paragraph(
    'Al abrir por primera vez aparece un <b>asistente de 2 pasos</b>:', sBody))
story.append(bullet('<b>Paso 1:</b> Elegís tu profesión entre 9 rubros disponibles'))
story.append(bullet('<b>Paso 2:</b> Nombre completo y especialidad'))
story.append(Paragraph(
    'Esto carga automáticamente los servicios típicos del rubro y habilita '
    'solo las herramientas relevantes para tu profesión.',
    sBody
))

# Rubros
rubros = [
    ('🦷', 'Odontología'), ('🩺', 'Medicina'), ('🧠', 'Psicología / Psicopedagogía'),
    ('💪', 'Kinesiología'), ('🥗', 'Nutrición'), ('✂️', 'Peluquería / Barbería'),
    ('✨', 'Estética'), ('📚', 'Psicopedagogía'), ('💼', 'Otro / Independiente'),
]
rubro_data = [[Paragraph(f'{e}  {l}', sSmall) for e, l in rubros[i:i+3]] for i in range(0, 9, 3)]
rubro_table = Table(rubro_data, colWidths=[5.5*cm, 5.5*cm, 5.5*cm])
rubro_table.setStyle(TableStyle([
    ('BACKGROUND',   (0,0), (-1,-1), CYAN_LIGHT),
    ('ALIGN',        (0,0), (-1,-1), 'LEFT'),
    ('TOPPADDING',   (0,0), (-1,-1), 6),
    ('BOTTOMPADDING',(0,0), (-1,-1), 6),
    ('LEFTPADDING',  (0,0), (-1,-1), 10),
    ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ('GRID',         (0,0), (-1,-1), 0.5, WHITE),
    ('ROUNDEDCORNERS', [6]),
]))
story.append(rubro_table)
story.append(Spacer(1, 4))

# ── MÓDULOS ───────────────────────────────────────────────────────────────────
story.append(section_title('Módulos de la aplicación'))

# --- Inicio
story.append(Paragraph('🏠  Inicio (Dashboard)', sH2))
story.append(Paragraph('Vista central del día. Contiene:', sBody))
story.append(bullet('<b>Accesos rápidos</b> — Nuevo turno · Nuevo paciente · Nueva receta (salud) · Historial'))
story.append(bullet('<b>Estadísticas</b> — Turnos hoy, pendientes, confirmados, total de pacientes'))
story.append(bullet('<b>Agenda del día</b> — lista ordenada con estado visual de cada turno'))

story.append(Spacer(1, 6))

# --- Turnos
story.append(Paragraph('📅  Turnos', sH2))
story.append(bullet('Creación con <b>duración flexible por servicio</b> — cada servicio tiene su propia duración'))
story.append(bullet('Detección automática de solapamientos en la grilla'))
story.append(bullet('Campo específico por rubro: pieza dental, tipo de sesión, zona tratada, etc.'))
story.append(bullet('Estados: Pendiente → Confirmado → Atendido / Cancelado (con motivo)'))
story.append(bullet('Bloqueo de horarios: vacaciones, reuniones, etc.'))

story.append(Spacer(1, 6))

# --- Pacientes
story.append(Paragraph('👥  Pacientes / Clientes', sH2))
story.append(Paragraph(
    '<i>(La terminología cambia según el rubro: "pacientes" para salud, "clientes" para peluquería/estética)</i>', sSmall))
story.append(Spacer(1, 4))

ficha_data = [
    [Paragraph('Rubro', sTag), Paragraph('Campos del formulario', sTag)],
    ['Salud general', 'Nombre, DNI, edad, teléfono, email, obra social, alergias, antecedentes'],
    ['Peluquería', 'Nombre, teléfono, email, edad, alergias a productos, tipo de cabello / preferencias'],
    ['Estética', 'Nombre, teléfono, email, edad, sensibilidades cutáneas, historial de tratamientos'],
]
ficha_table = Table(ficha_data, colWidths=[4*cm, 12.5*cm])
ficha_table.setStyle(TableStyle([
    ('BACKGROUND',   (0,0), (-1,0), DARK),
    ('TEXTCOLOR',    (0,0), (-1,0), WHITE),
    ('FONTNAME',     (0,0), (-1,0), 'Helvetica-Bold'),
    ('FONTSIZE',     (0,0), (-1,-1), 8.5),
    ('BACKGROUND',   (0,1), (-1,1), CYAN_LIGHT),
    ('BACKGROUND',   (0,2), (-1,2), GRAY_LIGHT),
    ('BACKGROUND',   (0,3), (-1,3), CYAN_LIGHT),
    ('TOPPADDING',   (0,0), (-1,-1), 6),
    ('BOTTOMPADDING',(0,0), (-1,-1), 6),
    ('LEFTPADDING',  (0,0), (-1,-1), 10),
    ('GRID',         (0,0), (-1,-1), 0.3, WHITE),
]))
story.append(ficha_table)

story.append(Spacer(1, 6))
story.append(Paragraph('Desde cada paciente podés acceder a:', sBody))
story.append(bullet('<b>Ver detalle</b> — ficha resumida'))
story.append(bullet('<b>Editar</b> — modificar datos'))
story.append(bullet('<b>Historial</b> — consultas y evolución'))
story.append(bullet('<b>Receta</b> — acceso directo al recetario (rubros de salud)'))
story.append(bullet('<b>Ficha prof. / Ficha cliente</b> — herramientas específicas del rubro'))

story.append(Spacer(1, 6))

# --- Ficha profesional
story.append(Paragraph('🗂  Ficha profesional', sH2))

herr_data = [
    [Paragraph('Rubro', sTag), Paragraph('Herramientas disponibles', sTag)],
    ['Odontología',          'Odontograma interactivo (32 dientes, FDI, 7 tratamientos) + Recetas'],
    ['Medicina',             'Notas SOAP/evolución + Mediciones (peso, TA, glucemia) + Recetas'],
    ['Psicología / Psicoped.','Notas de sesión con modo privado + Recetas'],
    ['Kinesiología',         'Notas de evolución + Mediciones antropométricas + Recetas'],
    ['Nutrición',            'Mediciones completas (peso, IMC, cintura, cadera, brazo, muslo) + gráfico'],
    ['Peluquería',           'Historial de fórmulas, coloraciones y técnicas + próxima visita'],
    ['Estética',             'Historial de tratamientos, productos utilizados y resultados'],
]
herr_table = Table(herr_data, colWidths=[4.5*cm, 12*cm])
herr_table.setStyle(TableStyle([
    ('BACKGROUND',   (0,0), (-1,0), DARK),
    ('TEXTCOLOR',    (0,0), (-1,0), WHITE),
    ('FONTNAME',     (0,0), (-1,0), 'Helvetica-Bold'),
    ('FONTSIZE',     (0,0), (-1,-1), 8.5),
    *[('BACKGROUND', (0,i), (-1,i), CYAN_LIGHT if i % 2 == 1 else GRAY_LIGHT) for i in range(1,8)],
    ('TOPPADDING',   (0,0), (-1,-1), 6),
    ('BOTTOMPADDING',(0,0), (-1,-1), 6),
    ('LEFTPADDING',  (0,0), (-1,-1), 10),
    ('GRID',         (0,0), (-1,-1), 0.3, WHITE),
]))
story.append(herr_table)

story.append(Spacer(1, 6))

# --- Recetas
story.append(Paragraph('📋  Recetas / Indicaciones  (rubros de salud)', sH2))
story.append(Paragraph('Accesibles desde tres lugares:', sBody))
story.append(bullet('<b>Inicio</b> → botón "Nueva receta" (con selector de paciente)'))
story.append(bullet('<b>Pacientes</b> → botón "Receta" en cada paciente (acceso directo)'))
story.append(bullet('<b>Ficha profesional</b> → sección al final de la ficha'))
story.append(Spacer(1, 4))
story.append(Paragraph('Cada receta incluye: diagnóstico (opcional), medicamentos en texto libre '
    '(formato recetario clásico), indicaciones adicionales y fecha.', sBody))
story.append(Spacer(1, 4))
story.append(Paragraph('<b>Al imprimir / guardar PDF</b>, genera un documento con:', sBody))
story.append(bullet('Encabezado: logo del consultorio, nombre, especialidad, matrícula, domicilio, teléfono'))
story.append(bullet('Nombre del paciente + DNI + fecha'))
story.append(bullet('Símbolo <b>Rp/</b> tradicional + cuerpo de medicamentos'))
story.append(bullet('Espacio de firma con nombre y matrícula'))
story.append(bullet('Pie de página legal personalizable (texto libre)'))
story.append(bullet('Tamaño de hoja: <b>A5</b> (recetario tradicional) o <b>A4</b>'))

story.append(Spacer(1, 6))

# --- Historial
story.append(Paragraph('📖  Historial', sH2))
story.append(Paragraph(
    'Registro de consultas por paciente: tratamiento realizado, notas clínicas, '
    'próxima visita. Filtrable por paciente, accesible también desde la ficha.',
    sBody
))

story.append(Spacer(1, 6))

# --- Finanzas
story.append(Paragraph('💰  Finanzas', sH2))

fin_data = [
    [Paragraph('Pestaña', sTag), Paragraph('Contenido', sTag)],
    ['Resumen',  'Balance mensual, KPIs de ingresos vs gastos, barras por categoría'],
    ['Cobros',   'Pagos recibidos: monto, método (efectivo/transferencia/débito/crédito/cheque), tipo de comprobante (fact. A/B/C, recibo, ticket), vinculado a paciente'],
    ['Gastos',   'Por categoría: alquiler, materiales, servicios básicos, equipamiento, honorarios, impuestos, marketing, otros. Con proveedor y N° de comprobante'],
]
fin_table = Table(fin_data, colWidths=[3.5*cm, 13*cm])
fin_table.setStyle(TableStyle([
    ('BACKGROUND',   (0,0), (-1,0), DARK),
    ('TEXTCOLOR',    (0,0), (-1,0), WHITE),
    ('FONTNAME',     (0,0), (-1,0), 'Helvetica-Bold'),
    ('FONTSIZE',     (0,0), (-1,-1), 8.5),
    ('BACKGROUND',   (0,1), (-1,1), CYAN_LIGHT),
    ('BACKGROUND',   (0,2), (-1,2), GRAY_LIGHT),
    ('BACKGROUND',   (0,3), (-1,3), CYAN_LIGHT),
    ('TOPPADDING',   (0,0), (-1,-1), 7),
    ('BOTTOMPADDING',(0,0), (-1,-1), 7),
    ('LEFTPADDING',  (0,0), (-1,-1), 10),
    ('GRID',         (0,0), (-1,-1), 0.3, WHITE),
    ('VALIGN',       (0,0), (-1,-1), 'TOP'),
]))
story.append(fin_table)

story.append(Spacer(1, 6))

# --- Reportes / Config
story.append(Paragraph('📊  Reportes', sH2))
story.append(Paragraph(
    'Estadísticas del período: turnos por estado, tasa de asistencia, '
    'servicios más frecuentes y evolución mensual.',
    sBody
))

story.append(Spacer(1, 6))
story.append(Paragraph('⚙️  Configuración', sH2))

cfg_items = [
    ('Perfil',       'Nombre, especialidad, rubro profesional'),
    ('Apariencia',   '8 paletas predefinidas + colores personalizados (acento y barra lateral) + logo de la app'),
    ('Servicios',    'Catálogo con nombre, duración y precio por servicio'),
    ('Horarios',     'Apertura, cierre, intervalo de grilla, días laborables'),
    ('Recetario',    'Matrícula, domicilio, teléfono, logo para recetas, tamaño de hoja (A4/A5), pie de página legal'),
    ('Cambiar rubro','Botón para volver al asistente inicial sin perder datos'),
]
cfg_data = [[Paragraph(k, S('bold', fontName='Helvetica-Bold', fontSize=8.5, textColor=DARK)), Paragraph(v, sSmall)] for k, v in cfg_items]
cfg_table = Table(cfg_data, colWidths=[3.5*cm, 13*cm])
cfg_table.setStyle(TableStyle([
    ('BACKGROUND',   (0,0), (-1,-1), GRAY_LIGHT),
    *[('BACKGROUND', (0,i), (-1,i), CYAN_LIGHT) for i in range(0,6,2)],
    ('TOPPADDING',   (0,0), (-1,-1), 6),
    ('BOTTOMPADDING',(0,0), (-1,-1), 6),
    ('LEFTPADDING',  (0,0), (-1,-1), 10),
    ('GRID',         (0,0), (-1,-1), 0.3, WHITE),
    ('VALIGN',       (0,0), (-1,-1), 'MIDDLE'),
]))
story.append(cfg_table)

# ── DATOS Y PRIVACIDAD ────────────────────────────────────────────────────────
story.append(section_title('Datos y privacidad'))

priv_items = [
    ('📦 Almacenamiento', 'Todo se guarda en el localStorage del navegador. Nunca sale del dispositivo.'),
    ('🔒 Privacidad',     'Sin login, sin cuenta, sin servidor. Los datos son exclusivamente tuyos.'),
    ('🖼 Logos',          'Se guardan como imagen en base64 en el propio dispositivo.'),
    ('💾 Respaldo',       'Para hacer backup, simplemente duplicar la carpeta de datos del perfil del navegador.'),
    ('🌐 Conexión',       'Solo se requiere internet para cargar la tipografía (Google Fonts). Todo lo demás funciona offline.'),
]
for icon_title, desc in priv_items:
    story.append(KeepTogether([
        Paragraph(f'<b>{icon_title}</b>', sBody),
        Paragraph(desc, sBullet),
        Spacer(1, 2),
    ]))

# ── ACCESO ────────────────────────────────────────────────────────────────────
story.append(section_title('Acceso'))
story.append(Paragraph(
    'Abrir el archivo <b>bundle.html</b> directamente en Edge, Chrome o cualquier navegador moderno. '
    'Sin instalación. Sin actualizaciones forzadas.',
    sBody
))

# Compatibilidad
compat_data = [
    [Paragraph('Navegador', sTag), Paragraph('Soporte', sTag)],
    ['Microsoft Edge', '✅ Recomendado'],
    ['Google Chrome',  '✅ Completo'],
    ['Firefox',        '✅ Completo'],
    ['Safari',         '✅ Completo'],
]
compat_table = Table(compat_data, colWidths=[8*cm, 8.5*cm])
compat_table.setStyle(TableStyle([
    ('BACKGROUND',   (0,0), (-1,0), DARK),
    ('TEXTCOLOR',    (0,0), (-1,0), WHITE),
    ('FONTNAME',     (0,0), (-1,0), 'Helvetica-Bold'),
    ('FONTSIZE',     (0,0), (-1,-1), 9),
    ('BACKGROUND',   (0,1), (-1,2), CYAN_LIGHT),
    ('BACKGROUND',   (0,2), (-1,2), GRAY_LIGHT),
    ('BACKGROUND',   (0,3), (-1,3), CYAN_LIGHT),
    ('BACKGROUND',   (0,4), (-1,4), GRAY_LIGHT),
    ('TOPPADDING',   (0,0), (-1,-1), 7),
    ('BOTTOMPADDING',(0,0), (-1,-1), 7),
    ('LEFTPADDING',  (0,0), (-1,-1), 14),
    ('GRID',         (0,0), (-1,-1), 0.3, WHITE),
]))
story.append(compat_table)

# ── FOOTER ────────────────────────────────────────────────────────────────────
story.append(Spacer(1, 20))
story.append(hr(GRAY_LIGHT))
story.append(Paragraph('GestiónTurnos — Agenda profesional local · Versión 1.0', sFooter))

# ── BUILD ─────────────────────────────────────────────────────────────────────
doc.build(story)
print(f'PDF generado: {OUT}')
