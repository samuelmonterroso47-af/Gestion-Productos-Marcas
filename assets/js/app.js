// Inteligencia Comercial 2WH · 3WH — lógica de los 6 módulos.
// Datos: data/datos.json (flota real del INE + ventas/clientes ficticios).

const $ = (id) => document.getElementById(id);
const q = (n) => "Q" + Math.round(n).toLocaleString("es-GT");
const n0 = (n) => Math.round(n).toLocaleString("es-GT");
const pct = (x, d = 1) => (x * 100).toFixed(d) + " %";
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const pill = (txt, color) => `<span class="pill ${color}">${esc(txt)}</span>`;

let D;                       // dataset
const vistas = {};           // filas actuales por módulo (para CSV)
const orden = {};            // orden de columna por módulo

// ---------- Utilidades de tabla ----------
// cols: [{k, t, num, fmt(row)->html, csv(row)->valor}]
function tabla(mod, cols, rows, defSort) {
  const st = orden[mod] || (orden[mod] = defSort || { k: cols[0].k, dir: -1 });
  const col = cols.find((c) => c.k === st.k) || cols[0];
  const val = (r) => (col.sort ? col.sort(r) : r[col.k]);
  rows = rows.slice().sort((a, b) => {
    const x = val(a), y = val(b);
    return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "es")) * st.dir;
  });
  vistas[mod] = { cols, rows };
  const head = "<thead><tr>" + cols.map((c) =>
    `<th data-k="${c.k}" class="${c.num ? "num" : ""}">${esc(c.t)} ${c.k === st.k ? `<span class="arrow">${st.dir > 0 ? "▲" : "▼"}</span>` : ""}</th>`).join("") + "</tr></thead>";
  const body = rows.length
    ? "<tbody>" + rows.map((r) => "<tr>" + cols.map((c) => `<td class="${c.num ? "num" : ""}">${c.fmt ? c.fmt(r) : esc(r[c.k])}</td>`).join("") + "</tr>").join("") + "</tbody>"
    : `<tbody><tr><td class="empty" colspan="${cols.length}">No hay resultados con estos filtros.</td></tr></tbody>`;
  const t = $(mod + "-tabla");
  t.innerHTML = head + body;
  t.querySelectorAll("th").forEach((th) => th.addEventListener("click", () => {
    const k = th.dataset.k;
    orden[mod] = { k, dir: st.k === k ? -st.dir : -1 };
    render[mod]();
  }));
  $(mod + "-count").textContent = `${n0(rows.length)} ${rows.length === 1 ? "fila" : "filas"}`;
}

function kpis(id, items) {
  $(id).innerHTML = items.map((k) =>
    `<div class="kpi${k.on ? " on" : ""}" ${k.key ? `data-key="${esc(k.key)}"` : ""}><div class="v" style="${k.color ? "color:" + k.color : ""}">${k.v}</div><div class="l">${esc(k.l)}</div></div>`).join("");
}

function opciones(id, valores, todos) {
  const el = $(id), actual = el.value;
  el.innerHTML = (todos ? `<option>${todos}</option>` : "") + valores.map((v) => `<option>${esc(v)}</option>`).join("");
  if ([...el.options].some((o) => o.value === actual)) el.value = actual;
}

function exportarCSV(mod) {
  const v = vistas[mod]; if (!v) return;
  const limpia = (x) => { const s = String(x ?? "").replace(/"/g, '""'); return /[",\n;]/.test(s) ? `"${s}"` : s; };
  const lineas = [v.cols.map((c) => limpia(c.t)).join(",")].concat(
    v.rows.map((r) => v.cols.map((c) => limpia(c.csv ? c.csv(r) : r[c.k])).join(",")));
  const blob = new Blob(["﻿" + lineas.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `${mod}-${D.corte}.csv` });
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
}

const diasEntre = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const avg = (arr) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0);

// ---------- Módulo 1: Mercado 3WH ----------
function m1() {
  const dep = $("m1-depto").value, umbral = (+$("m1-umbral").value || 0) / 100, gasto = +$("m1-gasto").value || 1;
  const txt = $("m1-buscar").value.trim().toLowerCase();
  const rows = D.mercado3wh
    .filter((m) => (dep === "Todos" || m.depto === dep) && (!txt || m.muni.toLowerCase().includes(txt)))
    .map((m) => {
      const pot = m.flota * gasto, pAnt = m.ventaAnt / pot, pAct = m.ventaAct / pot;
      let rec, col;
      if (pAct < umbral) { rec = "Enfocar: participación baja"; col = "red"; }
      else if (pAct < pAnt * 0.95) { rec = "Recuperar: perdió participación"; col = "amber"; }
      else { rec = "Mantener / expandir"; col = "green"; }
      return { ...m, pot, pAnt, pAct, delta: pAct - pAnt, rec, col };
    });
  const potT = rows.reduce((s, r) => s + r.pot, 0), venT = rows.reduce((s, r) => s + r.ventaAct, 0);
  kpis("m1-kpis", [
    { v: n0(rows.reduce((s, r) => s + r.flota, 0)), l: "Mototaxis registrados" },
    { v: q(potT), l: "Mercado potencial mensual" },
    { v: potT ? pct(venT / potT) : "—", l: "Participación ponderada" },
    { v: n0(rows.filter((r) => r.col === "red").length), l: "Municipios a enfocar", color: "var(--red)" },
    { v: n0(rows.filter((r) => r.col === "amber").length), l: "Perdiendo participación", color: "var(--amber)" }
  ]);
  tabla("m1", [
    { k: "muni", t: "Municipio", fmt: (r) => `${esc(r.muni)}<div class="muted" style="font-size:12px">${esc(r.depto)}</div>` },
    { k: "flota", t: "Mototaxis", num: true, fmt: (r) => n0(r.flota) },
    { k: "pot", t: "Potencial mensual", num: true, fmt: (r) => q(r.pot), csv: (r) => Math.round(r.pot) },
    { k: "ventaAnt", t: "Venta mes anterior", num: true, fmt: (r) => q(r.ventaAnt) },
    { k: "ventaAct", t: "Venta mes actual", num: true, fmt: (r) => q(r.ventaAct) },
    { k: "pAct", t: "Participación", num: true, csv: (r) => (r.pAct * 100).toFixed(1),
      fmt: (r) => `${pct(r.pAct)}<div class="bar"><i style="width:${Math.min(100, r.pAct * 200)}%;background:var(--${r.col === "red" ? "red" : r.col === "amber" ? "amber" : "blue"})"></i></div>` },
    { k: "delta", t: "Cambio", num: true, csv: (r) => (r.delta * 100).toFixed(1),
      fmt: (r) => `<span class="${r.delta >= 0 ? "up" : "down"}">${r.delta >= 0 ? "▲" : "▼"} ${(Math.abs(r.delta) * 100).toFixed(1)} pts</span>` },
    { k: "rec", t: "Recomendación", fmt: (r) => pill(r.rec, r.col) }
  ], rows, { k: "flota", dir: -1 });
}

// ---------- Módulo 2: Mercado 2WH ----------
function m2() {
  const dep = $("m2-depto").value, est = $("m2-estado").value, txt = $("m2-buscar").value.trim().toLowerCase();
  let rows = D.mercado2wh
    .filter((m) => (dep === "Todos" || m.depto === dep) && (!txt || m.muni.toLowerCase().includes(txt)))
    .map((m) => {
      const r = m.ventaAct / m.ventaProm;
      const [estado, col] = r < 0.8 ? ["Promover / crecer", "red"] : r < 0.95 ? ["Bajo promedio", "amber"] : r <= 1.1 ? ["Normal", "blue"] : ["Sobre promedio", "green"];
      return { ...m, r, estado, col, porMoto: m.ventaAct / m.flota };
    });
  if (est !== "Todos") rows = rows.filter((r) => r.estado === est);
  kpis("m2-kpis", [
    { v: n0(rows.reduce((s, r) => s + r.flota, 0)), l: "Motos registradas" },
    { v: q(rows.reduce((s, r) => s + r.ventaAct, 0)), l: "Venta del mes" },
    { v: n0(rows.filter((r) => r.col === "red").length), l: "Promover / crecer", color: "var(--red)" },
    { v: n0(rows.filter((r) => r.col === "green").length), l: "Sobre promedio", color: "var(--green)" }
  ]);
  tabla("m2", [
    { k: "muni", t: "Municipio", fmt: (r) => `${esc(r.muni)}<div class="muted" style="font-size:12px">${esc(r.depto)}</div>` },
    { k: "flota", t: "Motos", num: true, fmt: (r) => n0(r.flota) },
    { k: "ventaAct", t: "Mes actual", num: true, fmt: (r) => q(r.ventaAct) },
    { k: "ventaProm", t: "Promedio", num: true, fmt: (r) => q(r.ventaProm) },
    { k: "r", t: "Vs. promedio", num: true, csv: (r) => (r.r * 100).toFixed(1), fmt: (r) => `<span class="${r.r >= 1 ? "up" : "down"}">${pct(r.r - 1)}</span>` },
    { k: "porMoto", t: "Venta por moto", num: true, fmt: (r) => "Q" + r.porMoto.toFixed(2), csv: (r) => r.porMoto.toFixed(2) },
    { k: "estado", t: "Estado", fmt: (r) => pill(r.estado, r.col) }
  ], rows, { k: "flota", dir: -1 });
}

// ---------- Módulo 3: Clientes ----------
function perfilCliente(c) {
  const v = c.ventas, act = v[v.length - 1], p3 = avg(v.slice(-4, -1)), p6 = avg(v.slice(-7, -1));
  const primera = v.findIndex((x) => x > 0), nuevo = primera >= v.length - 3;
  const top = avg(v.slice(-3));
  let seg;
  if (act === 0) seg = "Sin compra";
  else if (nuevo) seg = "Nuevo";
  else if (p3 > 0 && act < p3 * 0.8) seg = "En riesgo";
  else seg = "Estable";
  return { ...c, act, p3, p6, top, seg, tend: p6 ? act / p6 - 1 : 0 };
}
let segFiltro = "Todos";
function m3() {
  const todos = D.clientes.map(perfilCliente);
  const corte = todos.map((c) => c.top).sort((a, b) => b - a)[Math.max(0, Math.floor(todos.length * 0.2) - 1)];
  todos.forEach((c) => { c.esTop = c.top >= corte && c.seg !== "Sin compra"; });
  const dep = $("m3-depto").value; segFiltro = $("m3-seg").value;
  const conteo = (s) => todos.filter((c) => (s === "Top" ? c.esTop : c.seg === s)).length;
  kpis("m3-kpis", [
    { v: n0(conteo("Sin compra")), l: "Sin compra este mes", key: "Sin compra", color: "var(--red)", on: segFiltro === "Sin compra" },
    { v: n0(conteo("Nuevo")), l: "Clientes nuevos", key: "Nuevo", color: "var(--blue)", on: segFiltro === "Nuevo" },
    { v: n0(conteo("En riesgo")), l: "En riesgo (−20 % vs. 3 meses)", key: "En riesgo", color: "var(--amber)", on: segFiltro === "En riesgo" },
    { v: n0(conteo("Top")), l: "Clientes top (20 %)", key: "Top", color: "var(--green)", on: segFiltro === "Top" }
  ]);
  document.querySelectorAll("#m3-kpis .kpi").forEach((el) => el.addEventListener("click", () => {
    $("m3-seg").value = segFiltro === el.dataset.key ? "Todos" : el.dataset.key; m3();
  }));
  const rows = todos.filter((c) => (dep === "Todos" || c.depto === dep) &&
    (segFiltro === "Todos" || (segFiltro === "Top" ? c.esTop : c.seg === segFiltro)));
  const colSeg = { "Sin compra": "red", "Nuevo": "blue", "En riesgo": "amber", "Estable": "green" };
  tabla("m3", [
    { k: "nombre", t: "Cliente", fmt: (r) => `${esc(r.nombre)}${r.esTop ? ' <span class="pill green">Top</span>' : ""}<div class="muted" style="font-size:12px">${esc(r.depto)}</div>` },
    { k: "act", t: "Mes actual", num: true, fmt: (r) => q(r.act) },
    { k: "p3", t: "Promedio 3 meses", num: true, fmt: (r) => q(r.p3) },
    { k: "p6", t: "Promedio 6 meses", num: true, fmt: (r) => q(r.p6) },
    { k: "tend", t: "Tendencia", num: true, csv: (r) => (r.tend * 100).toFixed(1),
      fmt: (r) => r.act === 0 ? '<span class="down">Sin compra</span>' : `<span class="${r.tend >= 0 ? "up" : "down"}">${r.tend >= 0 ? "▲" : "▼"} ${pct(Math.abs(r.tend))}</span>` },
    { k: "seg", t: "Segmento", fmt: (r) => pill(r.seg, colSeg[r.seg]) }
  ], rows, { k: "act", dir: -1 });
}

// ---------- Módulo 4: Recuperación de marcas ----------
function ultimas(campo) {
  const m = new Map();
  D.compras.forEach((c) => { const k = c.cliente + "|" + c[campo]; if (!m.has(k) || m.get(k) < c.fecha) m.set(k, c.fecha); });
  return m;
}
function m4() {
  const cli = $("m4-cliente").value, mar = $("m4-marca").value, est = $("m4-estado").value;
  const a = +$("m4-alerta").value || 60, cr = Math.max(a + 1, +$("m4-critico").value || 120);
  const nombre = Object.fromEntries(D.clientes.map((c) => [c.id, c.nombre]));
  let rows = [...ultimas("marca")].map(([k, f]) => {
    const [id, marca] = k.split("|"), dias = diasEntre(f, D.corte);
    const [estado, col] = dias >= cr ? ["Crítico", "red"] : dias >= a ? ["Alerta", "amber"] : ["Normal", "green"];
    return { cliente: nombre[id], marca, fecha: f, dias, estado, col };
  });
  kpis("m4-kpis", [
    { v: n0(rows.filter((r) => r.estado === "Crítico").length), l: `Crítico (≥ ${cr} días)`, color: "var(--red)" },
    { v: n0(rows.filter((r) => r.estado === "Alerta").length), l: `Alerta (${a}–${cr - 1} días)`, color: "var(--amber)" },
    { v: n0(rows.filter((r) => r.estado === "Normal").length), l: "Normal", color: "var(--green)" }
  ]);
  rows = rows.filter((r) => (cli === "Todos" || r.cliente === cli) && (mar === "Todas" || r.marca === mar) && (est === "Todos" || r.estado === est));
  tabla("m4", [
    { k: "cliente", t: "Cliente" }, { k: "marca", t: "Marca" }, { k: "fecha", t: "Última compra" },
    { k: "dias", t: "Días transcurridos", num: true, fmt: (r) => n0(r.dias) },
    { k: "estado", t: "Estado", sort: (r) => ({ Crítico: 3, Alerta: 2, Normal: 1 }[r.estado]), fmt: (r) => pill(r.estado, r.col) }
  ], rows, { k: "dias", dir: -1 });
}

// ---------- Módulo 5: Recuperación de códigos ----------
const LS = "icm-asociaciones";
function asociaciones() {
  try { const g = JSON.parse(localStorage.getItem(LS)); if (g && typeof g === "object") return g; } catch (e) {}
  return JSON.parse(JSON.stringify(D.asociaciones));
}
function guardarAsoc(a) { try { localStorage.setItem(LS, JSON.stringify(a)); } catch (e) {} }
function m5() {
  const asoc = asociaciones();
  const cli = $("m5-cliente").value, cod = $("m5-codigo").value, est = $("m5-estado").value;
  const ult = ultimas("codigo");
  const nombre = Object.fromEntries(D.clientes.map((c) => [c.id, c.nombre]));
  const rows = [];
  D.clientes.forEach((c) => {
    Object.keys(asoc).forEach((principal) => {
      const rel = asoc[principal] || [];
      const fP = ult.get(c.id + "|" + principal);
      const fR = rel.map((r) => ult.get(c.id + "|" + r)).filter(Boolean).sort().pop();
      if (!fP && !fR) return; // nunca compró nada de esa familia
      const fecha = [fP, fR].filter(Boolean).sort().pop(), dias = diasEntre(fecha, D.corte);
      let estado, col;
      if (fP && diasEntre(fP, D.corte) < 90) { estado = "Activo"; col = "green"; }
      else if (fR && diasEntre(fR, D.corte) < 90) { estado = "Recuperado"; col = "blue"; }
      else { estado = "Pendiente"; col = "amber"; }
      rows.push({ cliente: nombre[c.id], codigo: principal, rel, fecha, dias, estado, col });
    });
  });
  const vis = rows.filter((r) => (cli === "Todos" || r.cliente === cli) && (cod === "Todos" || r.codigo === cod) && (est === "Todos" || r.estado === est));
  tabla("m5", [
    { k: "cliente", t: "Cliente" }, { k: "codigo", t: "Código principal" },
    { k: "rel", t: "Códigos relacionados", sort: (r) => r.rel.length, csv: (r) => r.rel.join(" | "),
      fmt: (r) => r.rel.length ? r.rel.map((x) => `<span class="chip">${esc(x)}<button type="button" title="Quitar asociación" data-quitar="${esc(r.codigo)}|${esc(x)}">×</button></span>`).join("") : '<span class="muted">—</span>' },
    { k: "fecha", t: "Última compra (familia)" },
    { k: "dias", t: "Días", num: true, fmt: (r) => n0(r.dias) },
    { k: "estado", t: "Estado", fmt: (r) => pill(r.estado, r.col) }
  ], vis, { k: "dias", dir: -1 });
  document.querySelectorAll("[data-quitar]").forEach((b) => b.addEventListener("click", () => {
    const [p, r] = b.dataset.quitar.split("|"), a = asociaciones();
    a[p] = (a[p] || []).filter((x) => x !== r); guardarAsoc(a); m5();
  }));
  opciones("m5-codigo", Object.keys(asoc).sort(), "Todos");
}

// ---------- Módulo 6: Oportunidades ----------
function m6() {
  const perf = Object.fromEntries(D.clientes.map((c) => [c.id, perfilCliente(c)]));
  const compradas = new Map();
  D.compras.forEach((c) => { if (!compradas.has(c.cliente)) compradas.set(c.cliente, new Set()); compradas.get(c.cliente).add(c.marca); });
  const accion = (p) => p.seg === "Sin compra" ? ["Reactivar con combo de regreso", "red"]
    : p.seg === "Nuevo" ? ["Combo de bienvenida", "blue"]
    : p.seg === "En riesgo" ? ["Regalía por volumen", "amber"]
    : p.act >= 30000 ? ["Escala de descuento por volumen", "green"] : ["Catálogo y muestra", "blue"];
  let rows = [];
  D.clientes.forEach((c) => {
    const ya = compradas.get(c.id) || new Set(), p = perf[c.id];
    D.marcas.filter((m) => !ya.has(m)).forEach((m) => {
      const [acc, col] = accion(p);
      rows.push({ cliente: c.nombre, marca: m, seg: p.seg, act: p.act, accion: acc, col, compradas: ya.size });
    });
  });
  opciones("m6-accion", [...new Set(rows.map((r) => r.accion))].sort(), "Todas");
  const cli = $("m6-cliente").value, mar = $("m6-marca").value, acc = $("m6-accion").value;
  rows = rows.filter((r) => (cli === "Todos" || r.cliente === cli) && (mar === "Todas" || r.marca === mar) && (acc === "Todas" || r.accion === acc));
  const porMarca = {}; rows.forEach((r) => (porMarca[r.marca] = (porMarca[r.marca] || 0) + 1));
  const mejor = Object.entries(porMarca).sort((a, b) => b[1] - a[1])[0];
  kpis("m6-kpis", [
    { v: n0(rows.length), l: "Oportunidades cliente × marca" },
    { v: n0(new Set(rows.map((r) => r.cliente)).size), l: "Clientes con marcas por probar" },
    { v: mejor ? esc(mejor[0]) : "—", l: mejor ? `Marca con más espacio (${mejor[1]} clientes)` : "Marca con más espacio" }
  ]);
  tabla("m6", [
    { k: "cliente", t: "Cliente" }, { k: "marca", t: "Marca nunca comprada" },
    { k: "compradas", t: "Marcas que ya compra", num: true },
    { k: "act", t: "Compra del mes", num: true, fmt: (r) => q(r.act) },
    { k: "seg", t: "Perfil" },
    { k: "accion", t: "Acción recomendada", fmt: (r) => pill(r.accion, r.col) }
  ], rows, { k: "act", dir: -1 });
}

const render = { m1, m2, m3, m4, m5, m6 };

// ---------- Inicio ----------
async function init() {
  try {
    D = await (await fetch("data/datos.json")).json();
  } catch (e) {
    document.querySelector("main").innerHTML = '<p class="empty">No se pudieron cargar los datos. Abre la app con un servidor local (por ejemplo <code>npx serve .</code>), no con doble clic.</p>';
    return;
  }
  $("nota").textContent = D.nota + " Corte: " + D.corte + ".";
  const deps3 = [...new Set(D.mercado3wh.map((m) => m.depto))].sort(), deps2 = [...new Set(D.mercado2wh.map((m) => m.depto))].sort();
  const nombres = D.clientes.map((c) => c.nombre), deps = [...new Set(D.clientes.map((c) => c.depto))].sort();
  opciones("m1-depto", deps3, "Todos"); opciones("m2-depto", deps2, "Todos"); opciones("m3-depto", deps, "Todos");
  opciones("m4-cliente", nombres, "Todos"); opciones("m4-marca", D.marcas, "Todas");
  opciones("m5-cliente", nombres, "Todos"); opciones("m6-cliente", nombres, "Todos"); opciones("m6-marca", D.marcas, "Todas");
  const cods = D.codigos.map((c) => c.codigo);
  opciones("m5-principal", cods); opciones("m5-relacionado", cods);

  document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("active", x === t));
    document.querySelectorAll(".mod").forEach((m) => m.classList.toggle("active", m.id === t.dataset.mod));
    render[t.dataset.mod]();
  }));
  Object.keys(render).forEach((mod) => {
    document.querySelectorAll(`#${mod} .filters select, #${mod} .filters input`).forEach((el) => {
      if (el.closest("#m5-form")) return;
      el.addEventListener(el.tagName === "INPUT" ? "input" : "change", render[mod]);
    });
  });
  document.querySelectorAll("[data-csv]").forEach((b) => b.addEventListener("click", () => exportarCSV(b.dataset.csv)));
  $("m5-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const p = $("m5-principal").value, r = $("m5-relacionado").value;
    if (!p || !r || p === r) return;
    const a = asociaciones(); a[p] = [...new Set([...(a[p] || []), r])]; guardarAsoc(a); m5();
  });
  $("m5-reset").addEventListener("click", () => { try { localStorage.removeItem(LS); } catch (e) {} m5(); });
  Object.values(render).forEach((f) => f());
}
init();
