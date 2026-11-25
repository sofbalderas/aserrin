# Recetario Navideño de Aserrín

Web app (React + Vite) para la Edición Navidad. Las recetas viven en `src/recetas.json`: para una edición nueva, cambia ese archivo, el título en `index.html` y los textos de `App.jsx`.

## 1. Supabase (captura de contactos)

En el SQL Editor de Supabase:

```sql
create table suscriptores (
  id uuid primary key default gen_random_uuid(),
  creado timestamptz default now(),
  contacto text unique not null,
  tipo text, edicion text, origen text,
  utm_source text, utm_medium text, utm_campaign text
);
alter table suscriptores enable row level security;
create policy "insertar anonimo" on suscriptores for insert to anon with check (true);
```

Los visitantes solo pueden insertar, no leer. Tú ves la lista desde el panel de Supabase.

## 2. Variables de entorno

Copia `.env.example` a `.env` y llena: URL y anon key de Supabase, ID de GA4, ID del píxel de Meta y la URL del aviso de privacidad de Aserrín. Si dejas GA o Meta vacíos, simplemente no se cargan.

## 3. Correr y publicar

```
npm install
npm run dev        # prueba local
npm run build      # genera dist/
```

En Vercel: sube la carpeta a un repositorio de GitHub, importa el proyecto (preset Vite) y agrega las mismas variables en Settings > Environment Variables. No necesita configuración extra de rutas.

## Eventos que se miden

| Evento GA4 | Evento Meta | Cuándo |
|---|---|---|
| page_view | PageView | cada cambio de pantalla |
| ver_receta | ViewContent | abrir una receta |
| guardar_receta | AddToWishlist | guardar |
| agregar_lista | personalizado | agregar ingredientes a la lista |
| compartir | personalizado | tocar Compartir |
| suscribirse | Lead | enviar correo o WhatsApp |

## Enlaces de campaña

Usa UTM en los anuncios y publicaciones, por ejemplo:
`https://TU-DOMINIO/?utm_source=meta&utm_medium=paid&utm_campaign=navidad2026`
Las UTM se guardan junto con cada contacto.
