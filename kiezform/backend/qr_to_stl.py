#!/usr/bin/env python3
import numpy as np
from stl import mesh
import qrcode
from PIL import Image
import argparse
import os


def create_qr_stl(input_data, output_file='qr_code.stl', base_size=40, thickness=1, qr_height=0.5, corner_radius=2, sharp_corners=False, from_image=False, min_margin=2):
    """
    Erstellt eine STL-Datei mit einem QR-Code auf einer quadratischen Basis.
    
    Args:
        input_data: Die URL/Text für den QR-Code oder Pfad zu einer Bilddatei
        output_file: Name der Output-STL-Datei
        base_size: Größe der quadratischen Basis in mm (Standard: 40mm)
        thickness: Dicke der Basis in mm (Standard: 1mm)
        qr_height: Höhe der QR-Code Erhebungen in mm (Standard: 0.5mm)
        corner_radius: Radius der abgerundeten Ecken in mm (Standard: 2mm)
        sharp_corners: Wenn True, werden eckige statt abgerundete Ecken verwendet
        from_image: Wenn True, wird input_data als Pfad zu einer Bilddatei behandelt
        min_margin: Mindestabstand des QR-Codes zum Rand in mm (Standard: 2mm)
    """
    
    if from_image:
        # QR-Code aus Bilddatei laden
        if not os.path.exists(input_data):
            raise FileNotFoundError(f"Bilddatei nicht gefunden: {input_data}")
        
        # Bild laden und zu Graustufen konvertieren
        img = Image.open(input_data).convert('L')
        
        # Bild zu Schwarz-Weiß konvertieren (Threshold bei 128)
        img_array = np.array(img)
        img_array = img_array < 128  # Schwarze Pixel werden True, weiße False
    else:
        # QR-Code generieren
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=1,
            border=2,
        )
        qr.add_data(input_data)
        qr.make(fit=True)
        
        # QR-Code als Bild erstellen
        img = qr.make_image(fill_color="black", back_color="white")
        
        # In NumPy Array konvertieren
        img_array = np.array(img)
        img_array = ~img_array  # Invertieren: schwarze Pixel werden True
    
    # Größe des QR-Codes
    qr_size = img_array.shape[0]
    
    # Maximale verfügbare Größe für QR-Code (Basis minus 2x min_margin)
    available_size = base_size - (2 * min_margin)
    
    # Skalierungsfaktor berechnen
    scale_factor = available_size / qr_size
    
    # Sicherstellen, dass der QR-Code nicht größer als verfügbar wird
    if scale_factor * qr_size > available_size:
        scale_factor = available_size / qr_size
    
    # Listen für Vertices und Faces
    vertices = []
    faces = []
    
    # Einfache, solide Basis erstellen
    if sharp_corners:
        # Eckige Basis - vollständig geschlossen
        base_vertices = [
            [0, 0, 0],
            [base_size, 0, 0],
            [base_size, base_size, 0],
            [0, base_size, 0],
            [0, 0, thickness],
            [base_size, 0, thickness],
            [base_size, base_size, thickness],
            [0, base_size, thickness],
        ]
        
        vertices.extend(base_vertices)
        
        # Untere Fläche
        faces.append([0, 2, 1])
        faces.append([0, 3, 2])
        
        # Obere Fläche
        faces.append([4, 5, 6])
        faces.append([4, 6, 7])
        
        # Seitenflächen
        faces.append([0, 1, 5])
        faces.append([0, 5, 4])
        faces.append([1, 2, 6])
        faces.append([1, 6, 5])
        faces.append([2, 3, 7])
        faces.append([2, 7, 6])
        faces.append([3, 0, 4])
        faces.append([3, 4, 7])
        
    else:
        # Abgerundete Basis - vollständig geschlossen
        segments = 8
        
        for angle_offset in [0, 90, 180, 270]:
            cx, cy = 0, 0
            if angle_offset == 0:
                cx, cy = base_size - corner_radius, base_size - corner_radius
            elif angle_offset == 90:
                cx, cy = corner_radius, base_size - corner_radius
            elif angle_offset == 180:
                cx, cy = corner_radius, corner_radius
            elif angle_offset == 270:
                cx, cy = base_size - corner_radius, corner_radius
            
            for i in range(segments + 1):
                angle = np.radians(angle_offset + i * 90 / segments)
                x = cx + corner_radius * np.cos(angle)
                y = cy + corner_radius * np.sin(angle)
                vertices.append([x, y, 0])
                vertices.append([x, y, thickness])
        
        center_bottom = [base_size/2, base_size/2, 0]
        center_top = [base_size/2, base_size/2, thickness]
        vertices.append(center_bottom)
        vertices.append(center_top)
        center_idx_bottom = len(vertices) - 2
        center_idx_top = len(vertices) - 1
        
        total_edge_vertices = (segments + 1) * 4
        
        # Untere und obere Fläche
        for i in range(0, total_edge_vertices * 2, 2):
            next_i = (i + 2) % (total_edge_vertices * 2)
            faces.append([center_idx_bottom, i, next_i])
            faces.append([center_idx_top, next_i + 1, i + 1])
        
        # Seitenflächen
        for i in range(0, total_edge_vertices * 2, 2):
            next_i = (i + 2) % (total_edge_vertices * 2)
            faces.append([i, next_i, next_i + 1])
            faces.append([i, next_i + 1, i + 1])
    
    # QR-Code Quader hinzufügen
    vertex_index = len(vertices)
    qr_actual_size = qr_size * scale_factor
    offset_x = max(min_margin, (base_size - qr_actual_size) / 2)
    offset_y = max(min_margin, (base_size - qr_actual_size) / 2)
    
    # Für jeden schwarzen Pixel einen einfachen Quader erstellen
    for y in range(qr_size):
        for x in range(qr_size):
            if img_array[y, x]:  # Schwarzer Pixel
                # Position des Quaders
                x_pos = offset_x + x * scale_factor
                y_pos = offset_y + (qr_size - 1 - y) * scale_factor
                
                # 8 Vertices für einen Quader (direkt auf der Basis aufliegend)
                cube_vertices = [
                    [x_pos, y_pos, thickness],
                    [x_pos + scale_factor, y_pos, thickness],
                    [x_pos + scale_factor, y_pos + scale_factor, thickness],
                    [x_pos, y_pos + scale_factor, thickness],
                    [x_pos, y_pos, thickness + qr_height],
                    [x_pos + scale_factor, y_pos, thickness + qr_height],
                    [x_pos + scale_factor, y_pos + scale_factor, thickness + qr_height],
                    [x_pos, y_pos + scale_factor, thickness + qr_height],
                ]
                
                vertices.extend(cube_vertices)
                base_idx = vertex_index
                
                # Alle 6 Faces des Quaders
                # Obere Fläche
                faces.append([base_idx + 4, base_idx + 5, base_idx + 6])
                faces.append([base_idx + 4, base_idx + 6, base_idx + 7])
                
                # Untere Fläche (auf der Basis)
                faces.append([base_idx, base_idx + 2, base_idx + 1])
                faces.append([base_idx, base_idx + 3, base_idx + 2])
                
                # Seitenflächen
                faces.append([base_idx, base_idx + 1, base_idx + 5])
                faces.append([base_idx, base_idx + 5, base_idx + 4])
                faces.append([base_idx + 1, base_idx + 2, base_idx + 6])
                faces.append([base_idx + 1, base_idx + 6, base_idx + 5])
                faces.append([base_idx + 2, base_idx + 3, base_idx + 7])
                faces.append([base_idx + 2, base_idx + 7, base_idx + 6])
                faces.append([base_idx + 3, base_idx, base_idx + 4])
                faces.append([base_idx + 3, base_idx + 4, base_idx + 7])
                
                vertex_index += 8
    
    # NumPy Arrays erstellen
    vertices = np.array(vertices)
    faces = np.array(faces)
    
    # STL Mesh erstellen
    qr_mesh = mesh.Mesh(np.zeros(faces.shape[0], dtype=mesh.Mesh.dtype))
    
    for i, face in enumerate(faces):
        for j in range(3):
            qr_mesh.vectors[i][j] = vertices[face[j]]
    
    # STL-Datei speichern
    qr_mesh.save(output_file)
    print(f"STL-Datei '{output_file}' wurde erfolgreich erstellt!")
    print(f"Basis: {base_size}x{base_size}x{thickness}mm")
    print(f"QR-Code Höhe: {qr_height}mm über der Basis")


def main():
    parser = argparse.ArgumentParser(description='Erstellt eine STL-Datei mit QR-Code')
    parser.add_argument('input', help='URL/Text für den QR-Code oder Pfad zu einer Bilddatei (PNG, JPG, JPEG)')
    parser.add_argument('-o', '--output', default='qr_code.stl', help='Name der Output-STL-Datei')
    parser.add_argument('-s', '--size', type=float, default=40, help='Größe der quadratischen Basis in mm (Standard: 40)')
    parser.add_argument('-t', '--thickness', type=float, default=1, help='Dicke der Basis in mm (Standard: 1)')
    parser.add_argument('-q', '--qr-height', type=float, default=0.5, help='Höhe der QR-Code Erhebungen in mm (Standard: 0.5)')
    parser.add_argument('-r', '--corner-radius', type=float, default=2, help='Radius der abgerundeten Ecken in mm (Standard: 2)')
    parser.add_argument('-x', '--sharp-corners', action='store_true', help='Eckige statt abgerundete Ecken verwenden')
    parser.add_argument('-i', '--from-image', action='store_true', help='Input als Bilddatei (PNG, JPG, JPEG) behandeln')
    parser.add_argument('-m', '--min-margin', type=float, default=2, help='Mindestabstand des QR-Codes zum Rand in mm (Standard: 2)')
    
    args = parser.parse_args()
    
    # Automatische Erkennung von Bilddateien anhand der Dateiendung
    is_image = False
    if not args.from_image:
        input_lower = args.input.lower()
        if input_lower.endswith(('.png', '.jpg', '.jpeg')):
            is_image = True
            print(f"Bilddatei erkannt: {args.input}")
    else:
        is_image = True
    
    create_qr_stl(
        args.input,
        args.output,
        args.size,
        args.thickness,
        args.qr_height,
        args.corner_radius,
        args.sharp_corners,
        is_image,
        args.min_margin
    )


if __name__ == "__main__":
    main()