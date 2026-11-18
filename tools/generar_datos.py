"""Genera data/datos.json: flota real del INE (pública) + ventas y clientes ficticios.

Uso:  python tools/generar_datos.py ruta/a/parque-vehicular.json
La flota por municipio viene del registro público del parque vehicular (INE/SAT).
Las ventas, clientes, marcas y códigos son inventados para la demo.
"""
import json, random, sys, datetime, os

random.seed(3)
src = json.load(open(sys.argv[1], encoding="utf-8"))
G = src["grupos"]; iM, iT = G.index("Moto"), G.index("Trimoto")

# ---------- Mercado 3WH y 2WH (flota real, ventas ficticias) ----------
mer3, mer2 = [], []
for r in src["municipios"]:
    depto, muni, moto, tri = r[0], r[1], r[2 + iM], r[2 + iT]
    if tri >= 40:
        pot = tri * 150  # gasto mensual de referencia por mototaxi (Q)
        part = random.choice([random.uniform(0.02, 0.09), random.uniform(0.1, 0.25), random.uniform(0.25, 0.45)])
        ant = round(pot * part * random.uniform(0.85, 1.15), -2)
        act = round(ant * random.uniform(0.82, 1.22), -2)
        mer3.append({"depto": depto, "muni": muni, "flota": tri, "ventaAnt": ant, "ventaAct": act})
    if moto >= 2500:
        prom = round(moto * 6 * random.uniform(0.3, 1.1), -2)
        act = round(prom * random.uniform(0.65, 1.3), -2)
        mer2.append({"depto": depto, "muni": muni, "flota": moto, "ventaAct": act, "ventaProm": prom})

# ---------- Clientes, marcas y códigos (ficticios) ----------
MARCAS = ["Altura", "Roda", "Kronos", "Vértice", "Nexo", "Pampa"]
CATS = {"Llantas": ["LL", 6], "Baterías": ["BT", 4], "Frenos": ["FR", 5], "Transmisión": ["TR", 5], "Filtros": ["FL", 4]}
CODIGOS = []
for cat, (pre, n) in CATS.items():
    for i in range(1, n + 1):
        CODIGOS.append({"codigo": f"{pre}-{100 + i}", "categoria": cat, "marca": random.choice(MARCAS)})
deptos = sorted({m["depto"] for m in mer3} | {m["depto"] for m in mer2})
hoy = datetime.date(2026, 10, 31)
meses = [(hoy.replace(day=1) - datetime.timedelta(days=1)).replace(day=1)]
while len(meses) < 12:
    meses.insert(0, (meses[0] - datetime.timedelta(days=1)).replace(day=1))
meses = [m.isoformat()[:7] for m in meses]

clientes, compras = [], []
perfiles = ["estable"] * 18 + ["creciendo"] * 7 + ["cayendo"] * 7 + ["perdido"] * 4 + ["nuevo"] * 4
for i, perfil in enumerate(perfiles, 1):
    base = random.choice([8000, 15000, 25000, 40000, 70000])
    marcas_cli = random.sample(MARCAS, random.randint(2, 4))
    pool = [c for c in CODIGOS if c["marca"] in marcas_cli] or CODIGOS
    cods_cli = random.sample(pool, k=min(6, len(pool)))
    serie = []
    for k, mes in enumerate(meses):
        f = 1.0
        if perfil == "creciendo": f = 0.7 + 0.06 * k
        if perfil == "cayendo": f = 1.3 - 0.07 * k
        if perfil == "perdido" and k >= 8: f = 0
        if perfil == "nuevo" and k < 9: f = 0
        v = round(base * f * random.uniform(0.8, 1.2), -2) if f > 0 else 0
        serie.append(max(0, v))
        if v > 0:
            dia = random.randint(1, 28)
            for m in random.sample(marcas_cli, k=random.randint(1, len(marcas_cli))):
                compras.append({"cliente": i, "fecha": f"{mes}-{dia:02d}", "marca": m,
                                "codigo": random.choice([c["codigo"] for c in cods_cli if c["marca"] == m] or [cods_cli[0]["codigo"]])})
    clientes.append({"id": i, "nombre": f"Cliente {i:03d}", "depto": random.choice(deptos), "ventas": serie})

asociaciones = {}
for cat, (pre, n) in CATS.items():
    cods = [c["codigo"] for c in CODIGOS if c["categoria"] == cat]
    asociaciones[cods[0]] = cods[1:3]

out = {"nota": "Flota: registro público del parque vehicular (INE/SAT, mayo 2026). Ventas, clientes, marcas y códigos: datos ficticios.",
       "corte": hoy.isoformat(), "meses": meses, "mercado3wh": mer3, "mercado2wh": mer2, "marcas": MARCAS,
       "codigos": CODIGOS, "asociaciones": asociaciones, "clientes": clientes, "compras": compras}
os.makedirs("data", exist_ok=True)
json.dump(out, open("data/datos.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("3WH", len(mer3), "2WH", len(mer2), "clientes", len(clientes), "compras", len(compras), "KB", os.path.getsize("data/datos.json") // 1024)
