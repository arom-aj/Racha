#!/usr/bin/env python3
"""
====================================================================
PROYECTO RACHA - SCRIPT CONTROLADOR DE BASE DE DATOS (OFFLINE)
Permite inicializar la base de datos SQLite, registrar estudios,
calcular rachas y obtener el reporte de los últimos 7 días.
Uso:
    python3 db_controller.py init
    python3 db_controller.py estudiar
    python3 db_controller.py estado
    python3 db_controller.py ultimos7
    python3 db_controller.py frase
    python3 db_controller.py simular 7
    python3 db_controller.py exportar
====================================================================
"""

import sys
import os
import sqlite3
import datetime
import json

DB_FILE = os.path.join(os.path.dirname(__file__), "racha.db")
SCHEMA_FILE = os.path.join(os.path.dirname(__file__), "schema.sql")
SEED_FILE = os.path.join(os.path.dirname(__file__), "seed_data.sql")

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    print(f"📦 Inicializando base de datos en: {DB_FILE}")
    conn = get_connection()
    with open(SCHEMA_FILE, "r", encoding="utf-8") as f:
        conn.executescript(f.read())
    
    # Verificar si hay frases cargadas
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM motivational_quotes")
    if cur.fetchone()[0] == 0:
        with open(SEED_FILE, "r", encoding="utf-8") as f:
            conn.executescript(f.read())
        print("✨ Frases motivacionales cargadas con éxito.")
    
    conn.commit()
    conn.close()
    print("✅ Base de datos 'racha.db' creada y configurada.")

def mark_studied_today():
    init_db()
    today_str = datetime.date.today().isoformat()
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT id FROM study_logs WHERE study_date = ?", (today_str,))
    if cur.fetchone():
        print(f"⚠️ ¡Hoy ({today_str}) ya estaba registrado como estudiado!")
    else:
        cur.execute("INSERT INTO study_logs (study_date, duration_minutes) VALUES (?, ?)", (today_str, 30))
        conn.commit()
        print(f"🔥 ¡Éxito! Estudio registrado para hoy: {today_str}")
    
    conn.close()
    show_status()

def calculate_current_streak():
    conn = get_connection()
    cur = conn.cursor()
    
    # Obtener todas las fechas ordenadas
    cur.execute("SELECT study_date FROM study_logs ORDER BY study_date DESC")
    rows = cur.fetchall()
    conn.close()
    
    if not rows:
        return 0
    
    dates_set = {r["study_date"] for r in rows}
    today = datetime.date.today()
    yesterday = today - datetime.timedelta(days=1)
    
    streak = 0
    cursor_date = None
    
    if today.isoformat() in dates_set:
        cursor_date = today
    elif yesterday.isoformat() in dates_set:
        cursor_date = yesterday
    else:
        return 0
    
    while cursor_date.isoformat() in dates_set:
        streak += 1
        cursor_date -= datetime.timedelta(days=1)
        
    return streak

def show_status():
    init_db()
    streak = calculate_current_streak()
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT COUNT(*) FROM study_logs")
    total_days = cur.fetchone()[0]
    
    today_str = datetime.date.today().isoformat()
    cur.execute("SELECT id FROM study_logs WHERE study_date = ?", (today_str,))
    studied_today = cur.fetchone() is not None
    
    conn.close()
    
    print("\n" + "="*45)
    print("           🔥 ESTADO DE RACHA 🔥           ")
    print("="*45)
    print(f"  Racha consecutiva actual:  {streak} DÍAS")
    print(f"  Total de días estudiados:  {total_days} DÍAS")
    print(f"  Estado de hoy ({today_str}): {'✅ COMPLETADO' if studied_today else '⏳ PENDIENTE'}")
    print("="*45 + "\n")

def show_last_7_days():
    init_db()
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT study_date FROM study_logs")
    studied_set = {r["study_date"] for r in cur.fetchall()}
    conn.close()
    
    today = datetime.date.today()
    day_names = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    
    print("\n📅 ÚLTIMOS 7 DÍAS:")
    print("-" * 45)
    
    for i in range(6, -1, -1):
        d = today - datetime.timedelta(days=i)
        d_str = d.isoformat()
        is_today = (i == 0)
        label = "Hoy" if is_today else ("Ayer" if i == 1 else day_names[d.weekday()])
        studied = d_str in studied_set
        
        icon = "✅ ESTUDIADO " if studied else "❌ SIN REGISTRO"
        print(f"  [{label:<9}] {d_str}  -->  {icon}")
        
    print("-" * 45 + "\n")

def get_random_quote():
    init_db()
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, quote_text, author, category FROM motivational_quotes ORDER BY RANDOM() LIMIT 1")
    row = cur.fetchone()
    if row:
        print("\n💬 MENSAJE MOTIVADOR:")
        print(f'   "{row["quote_text"]}"')
        print(f'   — {row["author"]} ({row["category"].upper()})\n')
        cur.execute("UPDATE motivational_quotes SET times_displayed = times_displayed + 1 WHERE id = ?", (row["id"],))
        conn.commit()
    conn.close()

def simulate_days(count):
    init_db()
    conn = get_connection()
    cur = conn.cursor()
    today = datetime.date.today()
    
    for i in range(count):
        d = today - datetime.timedelta(days=i)
        cur.execute("INSERT OR IGNORE INTO study_logs (study_date, duration_minutes) VALUES (?, ?)", (d.isoformat(), 45))
        
    conn.commit()
    conn.close()
    print(f"✨ Simulación de {count} días consecutivos inyectada con éxito.")
    show_status()
    show_last_7_days()

def export_json():
    init_db()
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT study_date, duration_minutes, notes, created_at FROM study_logs ORDER BY study_date ASC")
    logs = [dict(r) for r in cur.fetchall()]
    
    streak = calculate_current_streak()
    data = {
        "export_date": datetime.datetime.now().isoformat(),
        "current_streak": streak,
        "total_days": len(logs),
        "logs": logs
    }
    
    filename = os.path.join(os.path.dirname(__file__), "backup_racha.json")
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        
    conn.close()
    print(f"💾 Copia de seguridad exportada en: {filename}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Comandos disponibles: init | estudiar | estado | ultimos7 | frase | simular <N> | exportar")
        show_status()
        sys.exit(0)
        
    cmd = sys.argv[1].lower()
    if cmd == "init":
        init_db()
    elif cmd in ("estudiar", "study"):
        mark_studied_today()
    elif cmd in ("estado", "status"):
        show_status()
    elif cmd in ("ultimos7", "7dias", "last7"):
        show_last_7_days()
    elif cmd in ("frase", "quote"):
        get_random_quote()
    elif cmd == "simular" and len(sys.argv) >= 3:
        simulate_days(int(sys.argv[2]))
    elif cmd == "exportar":
        export_json()
    else:
        print(f"Comando desconocido '{cmd}'. Usa: init, estudiar, estado, ultimos7, frase, simular <N>, exportar")
