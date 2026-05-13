import re
import os

def dms_to_decimal(degrees, minutes, seconds, direction):
    decimal = float(degrees) + float(minutes)/60 + float(seconds)/3600
    if direction in ['S', 'W']:
        decimal = -decimal
    return round(decimal, 6)

def parse_coords(coord_str):
    m = re.search(r'(\d+)°\s*(\d+)[\'´`]?\s*(\d+)[\"\'´`]?\s*([NSEW])', coord_str)
    if m:
        return dms_to_decimal(m.group(1), m.group(2), m.group(3), m.group(4))
    return 0.0

oacis = set()
aeropuertos = []

def parse_airports():
    filepath = '../Planificador/c.1inf54.26.1.v1.Aeropuerto.husos.v1.20250818__estudiantes.txt'
    content = ""
    for enc in ['utf-16', 'utf-16le', 'utf-16be', 'utf-8', 'latin-1']:
        try:
            with open(filepath, 'r', encoding=enc) as f:
                content = f.read()
            if "GMT" in content:
                break
        except:
            continue

    if not content:
        return

    current_continent = "America"
    for line in content.split('\n'):
        line_clean = line.strip()
        if not line_clean: continue
        
        if "Europa" in line: current_continent = "Europe"
        elif "Asia" in line: current_continent = "Asia"
        elif "America" in line: current_continent = "America"

        if line_clean.startswith('PDDS') or line_clean.startswith('***') or 'GMT' in line:
            continue
        
        m = re.search(r'^(\d+)\s+([A-Z0-9]{4})\s+(.+?)\s{2,}(.+?)\s{2,}(.+?)\s+([+-]?\d+)\s+(\d+)\s+(.+)$', line_clean)
        if m:
            oaci = m.group(2).strip()
            ciudad = m.group(3).strip().replace("'", "''")
            pais = m.group(4).strip().replace("'", "''")
            gmt = m.group(6).strip()
            cap = m.group(7).strip()
            coords_part = m.group(8)
            
            lat_str = re.search(r'Latitude:\s*(.+?)(?=Longitude:|$)', coords_part)
            lon_str = re.search(r'Longitude:\s*(.+)$', coords_part)
            
            lat = parse_coords(lat_str.group(1)) if lat_str else 0.0
            lon = parse_coords(lon_str.group(1)) if lon_str else 0.0

            aeropuertos.append(f"('{oaci}', '{ciudad}', '{pais}', '{current_continent}', {gmt}, {cap}, {lat}, {lon})")
            oacis.add(oaci)

def parse_vuelos():
    filepath = '../Planificador/planes_vuelo.txt'
    vuelos = []
    if not os.path.exists(filepath): return []
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line: continue
            parts = line.split('-')
            if len(parts) >= 5:
                origen, destino, salida, llegada, cap = parts[:5]
                if origen in oacis and destino in oacis:
                    vuelos.append(f"('{origen}', '{destino}', '{salida}:00', '{llegada}:00', {cap})")
    return vuelos

parse_airports()
vuelos = parse_vuelos()

with open('data.sql', 'w', encoding='utf-8') as out:
    out.write("USE suitchase;\n\n")
    out.write("DELETE FROM vuelo; DELETE FROM aeropuerto; DELETE FROM aerolinea; DELETE FROM usuario;\n\n")
    out.write("-- Aeropuertos\n")
    if aeropuertos:
        out.write("INSERT INTO aeropuerto (oaci, ciudad, pais, continente, gmt, capacidad_almacen, latitud, longitud) VALUES\n")
        out.write(",\n".join(aeropuertos) + ";\n\n")
    
    out.write("-- Aerolineas\n")
    out.write("INSERT INTO aerolinea (id, nombre, codigo) VALUES\n")
    out.write("(1, 'LATAM', 'LAN'),\n(2, 'Iberia', 'IBE'),\n(3, 'American Airlines', 'AA');\n\n")

    out.write("-- Vuelos\n")
    if vuelos:
        out.write("INSERT INTO vuelo (origen_oaci, destino_oaci, hora_salida, hora_llegada, capacidad) VALUES\n")
        out.write(",\n".join(vuelos) + ";\n\n")

    out.write("-- Usuarios (Password: password)\n")
    out.write("INSERT INTO usuario (username, password_hash, nombre_completo, rol, aerolinea_id, activo, created_at) VALUES\n")
    out.write("('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin Sistema', 'ADMIN', NULL, 1, NOW()),\n")
    out.write("('operario1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Juan Perez', 'OPERARIO', NULL, 1, NOW()),\n")
    out.write("('lan_user', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Gestor LATAM', 'AEROLINEA', 1, 1, NOW());\n")

print(f"Generated data.sql with {len(aeropuertos)} aeropuertos and {len(vuelos)} vuelos.")
