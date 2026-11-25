import { useEffect, useState } from "react";
import data from "./recetas.json";
import { track, pageview, utm } from "./track.js";

const SUPA = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const AVISO = import.meta.env.VITE_AVISO_URL || "#";
const catName = Object.fromEntries(data.categorias.map((c) => [c.id, c.nombre]));
const bySlug = Object.fromEntries(data.recetas.map((r) => [r.slug, r]));
const TITULO = "Recetario Navideño de Aserrín";

function useLocal(key, init) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; } catch { return init; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* almacenamiento no disponible */ } }, [key, v]);
  return [v, setV];
}

function useRoute() {
  const get = () => location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  const [r, setR] = useState(get);
  useEffect(() => {
    const f = () => { setR(get()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  return r;
}

export default function App() {
  const route = useRoute();
  const [guardadas, setGuardadas] = useLocal("guardadas", []);
  const [lista, setLista] = useLocal("lista", []);
  const [suscrito, setSuscrito] = useLocal("suscrito", false);
  const ctx = { guardadas, setGuardadas, lista, setLista, suscrito, setSuscrito };
  const key = route.join("/");
  const receta = route[0] === "receta" ? bySlug[route[1]] : null;

  useEffect(() => {
    document.title = receta ? `${receta.titulo} | ${TITULO}` : route[0] === "mi-lista" ? `Mi lista | ${TITULO}` : TITULO;
    pageview("/" + key, document.title);
  }, [key]);

  return (
    <>
      <header className="barra">
        <a className="marca" href="#/">Recetario Navideño</a>
        <a href="#/mi-lista">Mi lista</a>
      </header>
      <main>
        {receta ? <Receta r={receta} {...ctx} /> : route[0] === "mi-lista" ? <MiLista {...ctx} /> : <Inicio {...ctx} />}
      </main>
      <footer className="pie">Edición Navidad 2026 de Aserrín</footer>
    </>
  );
}

function Inicio({ suscrito, setSuscrito }) {
  return (
    <>
      <section className="portada">
        <h1 className="solo-lector">Recetario Navideño de Aserrín</h1>
        <img src="/portada.webp" width="1068" height="1060" alt="Recetario Navideño by Aserrín" fetchpriority="high" />
      </section>
      <div className="wrap inicio">
        {data.categorias.map((c) => (
          <section key={c.id}>
            <h2 className="cat">{c.nombre}</h2>
            <ul className="sin recetas">
              {data.recetas.filter((r) => r.categoria === c.id).map((r) => (
                <li key={r.slug}><a className="pastilla" href={`#/receta/${r.slug}`}>{r.titulo}</a></li>
              ))}
            </ul>
          </section>
        ))}
        <img className="acebo" src="/acebo.png" width="150" height="83" alt="" />
        <Suscripcion origen="inicio" suscrito={suscrito} setSuscrito={setSuscrito} />
      </div>
    </>
  );
}

function Receta({ r, guardadas, setGuardadas, lista, setLista, suscrito, setSuscrito }) {
  const [aviso, setAviso] = useState("");
  useEffect(() => { track("ver_receta", { receta: r.slug, categoria: r.categoria }, "ViewContent"); }, [r.slug]);

  const flash = (m) => { setAviso(m); setTimeout(() => setAviso(""), 2500); };
  const guardada = guardadas.includes(r.slug);
  const items = r.ingredientes.flatMap((g, gi) =>
    g.items.map((t, i) => ({ id: `${r.slug}:${gi}:${i}`, slug: r.slug, texto: t, hecho: false })));

  const guardar = () => {
    setGuardadas(guardada ? guardadas.filter((s) => s !== r.slug) : [...guardadas, r.slug]);
    if (!guardada) track("guardar_receta", { receta: r.slug }, "AddToWishlist");
  };
  const agregar = () => {
    const ya = new Set(lista.map((x) => x.id));
    setLista([...lista, ...items.filter((x) => !ya.has(x.id))]);
    track("agregar_lista", { receta: r.slug });
    flash("Ingredientes agregados a tu lista");
  };
  const compartir = async () => {
    const url = `${location.origin}${location.pathname}?utm_source=compartido&utm_medium=receta#/receta/${r.slug}`;
    track("compartir", { receta: r.slug });
    try {
      if (navigator.share) await navigator.share({ title: r.titulo, text: `${r.titulo}, del Recetario Navideño de Aserrín`, url });
      else { await navigator.clipboard.writeText(url); flash("Enlace copiado"); }
    } catch { /* compartir cancelado */ }
  };

  return (
    <div className="wrap">
      <a className="volver" href="#/">Todas las recetas</a>
      <article className="card hoja">
        <span className="cinta">{catName[r.categoria]}</span>
        <h1>{r.titulo}</h1>
        {r.subtitulo && <p className="sub">{r.subtitulo}</p>}
        <div className="acciones">
          <button className={"btn sec" + (guardada ? " on" : "")} onClick={guardar} aria-pressed={guardada}>
            {guardada ? "Receta guardada" : "Guardar receta"}
          </button>
          <button className="btn sec" onClick={compartir}>Compartir</button>
        </div>
        <h2>Ingredientes</h2>
        {r.ingredientes.map((g, i) => (
          <div key={i}>
            {g.grupo && <h3>{g.grupo}</h3>}
            <ul>{g.items.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        ))}
        <button className="btn" onClick={agregar}>Agregar ingredientes a mi lista</button>
        <h2>Preparación</h2>
        <ol>{r.pasos.map((p) => <li key={p}>{p}</li>)}</ol>
        {r.notas.map((n) => <aside className="nota" key={n}><strong>Nota</strong><p>{n}</p></aside>)}
        {r.relacionadas.length > 0 && (
          <p>Va bien con: {r.relacionadas.map((s) => <a key={s} href={`#/receta/${s}`}>{bySlug[s].titulo}</a>)}</p>
        )}
      </article>
      <Suscripcion origen={r.slug} suscrito={suscrito} setSuscrito={setSuscrito} />
      <p role="status" className={"toast" + (aviso ? " ver" : "")}>{aviso}</p>
    </div>
  );
}

function MiLista({ guardadas, lista, setLista }) {
  const grupos = [...new Set(lista.map((x) => x.slug))].filter((s) => bySlug[s]);
  const marcar = (id) => setLista(lista.map((x) => (x.id === id ? { ...x, hecho: !x.hecho } : x)));
  return (
    <div className="wrap">
      <h1 className="tit">Mi lista</h1>
      <section className="card">
        <h2>Recetas guardadas</h2>
        {guardadas.length ? (
          <ul className="sin">{guardadas.filter((s) => bySlug[s]).map((s) => <li key={s}><a href={`#/receta/${s}`}>{bySlug[s].titulo}</a></li>)}</ul>
        ) : <p>Aún no guardas ninguna. Abre una receta y toca Guardar receta.</p>}
      </section>
      <section className="card">
        <h2>Lista de compras</h2>
        {grupos.length ? grupos.map((s) => (
          <div key={s}>
            <h3>{bySlug[s].titulo}</h3>
            <ul className="sin">
              {lista.filter((x) => x.slug === s).map((x) => (
                <li key={x.id}>
                  <label className={x.hecho ? "hecho" : ""}>
                    <input type="checkbox" checked={x.hecho} onChange={() => marcar(x.id)} /> {x.texto}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )) : <p>Tu lista está vacía. En cada receta toca Agregar ingredientes a mi lista.</p>}
        {lista.length > 0 && <button className="btn sec" onClick={() => setLista([])}>Vaciar lista</button>}
      </section>
    </div>
  );
}

function Suscripcion({ origen, suscrito, setSuscrito }) {
  const [c, setC] = useState("");
  const [ok, setOk] = useState(false);
  const [msg, setMsg] = useState("");
  if (suscrito) return <section className="card caja"><h2>Gracias por unirte</h2><p>Te avisaremos cuando salga la próxima edición.</p></section>;

  const enviar = async (e) => {
    e.preventDefault();
    const v = c.trim();
    const esMail = /^\S+@\S+\.\S+$/.test(v);
    const tel = v.replace(/\D/g, "");
    if (!esMail && tel.length < 10) return setMsg("Escribe un correo o un WhatsApp de 10 dígitos.");
    if (!ok) return setMsg("Acepta el aviso de privacidad para continuar.");
    if (!SUPA || !KEY) return setMsg("Falta conectar Supabase. Revisa el README.");
    setMsg("Enviando…");
    try {
      const res = await fetch(`${SUPA}/rest/v1/suscriptores`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: "return=minimal" },
        body: JSON.stringify({ contacto: esMail ? v.toLowerCase() : tel, tipo: esMail ? "correo" : "whatsapp", edicion: data.edicion, origen, ...utm() }),
      });
      if (res.ok || res.status === 409) { track("suscribirse", { origen }, "Lead"); setSuscrito(true); }
      else setMsg("No pudimos guardar tus datos. Intenta de nuevo.");
    } catch { setMsg("No pudimos guardar tus datos. Revisa tu conexión e intenta de nuevo."); }
  };

  return (
    <section className="card caja">
      <p className="invita">Déjanos tu correo o WhatsApp y recibe la próxima edición.</p>
      <form onSubmit={enviar} noValidate>
        <label htmlFor="contacto">Correo o WhatsApp</label>
        <input id="contacto" value={c} onChange={(e) => setC(e.target.value)} autoComplete="email" inputMode="email" />
        <label className="chk"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /> Acepto el <a href={AVISO} target="_blank" rel="noreferrer">aviso de privacidad</a></label>
        <button className="btn" type="submit">Avisarme</button>
        <p role="status" className="msg">{msg}</p>
      </form>
    </section>
  );
}
