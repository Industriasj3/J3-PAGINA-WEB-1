import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const db = new Database("sneakers.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    external_id TEXT UNIQUE,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    price REAL NOT NULL,
    image TEXT NOT NULL,
    images TEXT,
    color TEXT DEFAULT 'bg-zinc-200',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    total REAL NOT NULL,
    items TEXT NOT NULL,
    receipt_image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    image TEXT NOT NULL,
    color TEXT DEFAULT 'text-red-500',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration: Add images column if it doesn't exist
try {
  db.prepare("SELECT images FROM products LIMIT 1").get();
} catch (e) {
  console.log("Adding 'images' column to products table...");
  db.exec("ALTER TABLE products ADD COLUMN images TEXT");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));
  app.use('/uploads', express.static(uploadsDir));

  // API Routes
  app.get("/api/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products ORDER BY created_at DESC").all();
    res.json(products);
  });

  app.post("/api/products", (req, res) => {
    let { name, brand, price, image, images, color } = req.body;
    
    const processImage = (imgData: string, index: number) => {
      if (imgData && imgData.startsWith('data:image/')) {
        const matches = imgData.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const extension = matches[1];
          const base64Data = matches[2];
          const filename = `upload_${Date.now()}_${index}.${extension}`;
          const filepath = path.join(uploadsDir, filename);
          
          fs.writeFileSync(filepath, base64Data, 'base64');
          return `/uploads/${filename}`;
        }
      }
      return imgData;
    };

    // Process main image
    image = processImage(image, 0);

    // Process multiple images if provided
    let processedImages = [];
    if (Array.isArray(images)) {
      processedImages = images.map((img, idx) => processImage(img, idx + 1));
    } else {
      processedImages = [image];
    }

    const info = db.prepare(
      "INSERT INTO products (name, brand, price, image, images, color) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(name, brand, price, image, JSON.stringify(processedImages), color || 'bg-zinc-200');
    
    res.json({ id: info.lastInsertRowid, name, brand, price, image, images: processedImages, color });
  });

  app.delete("/api/products/:id", (req, res) => {
    const product = db.prepare("SELECT image, images FROM products WHERE id = ?").get(req.params.id) as any;
    
    if (product) {
      // Delete main image
      if (product.image && product.image.startsWith('/uploads/')) {
        const filename = product.image.replace('/uploads/', '');
        const filepath = path.join(uploadsDir, filename);
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      }
      
      // Delete additional images
      if (product.images) {
        try {
          const images = JSON.parse(product.images);
          if (Array.isArray(images)) {
            images.forEach((img: string) => {
              if (img.startsWith('/uploads/')) {
                const filename = img.replace('/uploads/', '');
                const filepath = path.join(uploadsDir, filename);
                if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
              }
            });
          }
        } catch (e) {
          console.error("Error deleting additional images:", e);
        }
      }
    }

    db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/sales", (req, res) => {
    const sales = db.prepare("SELECT * FROM sales ORDER BY created_at DESC").all();
    res.json(sales);
  });

  app.get("/api/banners", (req, res) => {
    const banners = db.prepare("SELECT * FROM banners ORDER BY created_at DESC").all();
    res.json(banners);
  });

  app.post("/api/banners", (req, res) => {
    let { name, image, color } = req.body;

    if (image && image.startsWith('data:image/')) {
      const matches = image.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const extension = matches[1];
        const base64Data = matches[2];
        const filename = `banner_${Date.now()}.${extension}`;
        const filepath = path.join(uploadsDir, filename);
        
        fs.writeFileSync(filepath, base64Data, 'base64');
        image = `/uploads/${filename}`;
      }
    }

    const info = db.prepare(
      "INSERT INTO banners (name, image, color) VALUES (?, ?, ?)"
    ).run(name || 'Banner', image, color || 'text-red-500');
    
    res.json({ id: info.lastInsertRowid, name, image, color });
  });

  app.delete("/api/banners/:id", (req, res) => {
    const banner = db.prepare("SELECT image FROM banners WHERE id = ?").get(req.params.id) as any;
    if (banner && banner.image && banner.image.startsWith('/uploads/')) {
      const filename = banner.image.replace('/uploads/', '');
      const filepath = path.join(uploadsDir, filename);
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    }
    db.prepare("DELETE FROM banners WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/videos", (req, res) => {
    const videos = db.prepare("SELECT * FROM videos ORDER BY created_at DESC").all();
    res.json(videos);
  });

  app.post("/api/videos", (req, res) => {
    let { title, url, description } = req.body;

    // If it's a base64 video (unlikely for large files but possible for small ones)
    if (url && url.startsWith('data:video/')) {
      const matches = url.match(/^data:video\/([a-zA-Z0-9-+.]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        let extension = matches[1];
        const base64Data = matches[2];
        
        // Normalize common extensions
        if (extension === 'quicktime') extension = 'mov';
        if (extension === 'x-matroska') extension = 'mkv';
        if (extension.includes('+')) extension = extension.split('+')[0];
        
        const filename = `video_${Date.now()}.${extension}`;
        const filepath = path.join(uploadsDir, filename);
        
        fs.writeFileSync(filepath, base64Data, 'base64');
        url = `/uploads/${filename}`;
      }
    }

    const info = db.prepare(
      "INSERT INTO videos (title, url, description) VALUES (?, ?, ?)"
    ).run(title || 'Video', url, description || '');
    
    res.json({ id: info.lastInsertRowid, title, url, description });
  });

  app.delete("/api/videos/:id", (req, res) => {
    const video = db.prepare("SELECT url FROM videos WHERE id = ?").get(req.params.id) as any;
    if (video && video.url && video.url.startsWith('/uploads/')) {
      const filename = video.url.replace('/uploads/', '');
      const filepath = path.join(uploadsDir, filename);
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    }
    db.prepare("DELETE FROM videos WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/sales", (req, res) => {
    let { customer_name, total, items, receipt_image } = req.body;
    
    // Save receipt image if provided
    if (receipt_image && receipt_image.startsWith('data:image/')) {
      const matches = receipt_image.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const extension = matches[1];
        const base64Data = matches[2];
        const filename = `receipt_${Date.now()}.${extension}`;
        const filepath = path.join(uploadsDir, filename);
        
        fs.writeFileSync(filepath, base64Data, 'base64');
        receipt_image = `/uploads/${filename}`;
      }
    }

    const info = db.prepare(
      "INSERT INTO sales (customer_name, total, items, receipt_image) VALUES (?, ?, ?, ?)"
    ).run(customer_name, total, JSON.stringify(items), receipt_image);
    
    res.json({ id: info.lastInsertRowid, customer_name, total, receipt_image });
  });

  app.post("/api/sync", async (req, res) => {
    try {
      const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbxVvdtGClw8_8t08zu6eVS9lxu20-Tn5DLLpuBEgLSOmjviICgEv4jtNIU_XVM3kE9Y/exec";
      
      console.log("Iniciando sincronización desde:", GOOGLE_SHEET_URL);
      
      const response = await fetch(GOOGLE_SHEET_URL, {
        method: 'GET',
        redirect: 'follow'
      });
      
      if (!response.ok) {
        console.error(`Error de red al conectar con Google Sheets: ${response.status} ${response.statusText}`);
        throw new Error(`Error de red: ${response.status}`);
      }
      
      const text = await response.text();
      console.log("Respuesta cruda recibida (primeros 100 caracteres):", text.substring(0, 100));
      
      let externalData;
      try {
        externalData = JSON.parse(text);
      } catch (e) {
        console.error("Error al parsear JSON de Google Sheets. Contenido recibido:", text);
        throw new Error("La respuesta de Google Sheets no es un JSON válido. Asegúrate de que el script esté publicado correctamente.");
      }

      if (!Array.isArray(externalData)) {
        console.error("Los datos recibidos no son un array:", externalData);
        throw new Error("Formato de datos inválido: se esperaba una lista de productos.");
      }

      console.log(`Procesando ${externalData.length} productos...`);

      const upsert = db.prepare(`
        INSERT INTO products (external_id, name, brand, price, image, images, color)
        VALUES (@external_id, @name, @brand, @price, @image, @images, @color)
        ON CONFLICT(external_id) DO UPDATE SET
          name = excluded.name,
          brand = excluded.brand,
          price = excluded.price,
          image = excluded.image,
          images = excluded.images,
          color = excluded.color
      `);

      let updatedCount = 0;
      const transaction = db.transaction((items) => {
        for (const rawItem of items) {
          // Normalizar las llaves del objeto (minúsculas y sin espacios)
          const item: any = {};
          Object.keys(rawItem).forEach(key => {
            const normalizedKey = key.toLowerCase().trim();
            item[normalizedKey] = rawItem[key];
          });

          // Mapeo específico solicitado por el usuario
          const extId = item.id_externo || item.external_id || item.sku || item.id;
          const name = item.nombre || item.name || item.producto;
          const brand = item.marca || item.brand || "Genérico";
          const price = item.precio || item.price;
          const image = item.imagen || item.image || item.foto || "https://picsum.photos/600/600";
          const color = item.color || "bg-zinc-200";

          if (extId && name) {
            try {
              upsert.run({
                external_id: String(extId).trim(),
                name: String(name).trim(),
                brand: String(brand).trim(),
                price: parseFloat(price) || 0,
                image: String(image).trim(),
                images: JSON.stringify([String(image).trim()]),
                color: String(color).trim()
              });
              updatedCount++;
            } catch (err) {
              console.error(`Error al insertar/actualizar producto ${extId}:`, err);
            }
          } else {
            console.warn("Producto ignorado por falta de campos obligatorios (id_externo y nombre):", item);
          }
        }
      });

      transaction(externalData);
      console.log(`Sincronización completada. ${updatedCount} productos procesados.`);

      res.json({ 
        success: true, 
        message: `Inventario sincronizado: ${updatedCount} productos actualizados.`, 
        count: updatedCount 
      });
    } catch (error) {
      console.error("Error detallado en /api/sync:", error);
      res.status(500).json({ 
        success: false, 
        error: "Error al sincronizar el inventario",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Sincronización automática al iniciar para poblar la base de datos
    console.log("Ejecutando sincronización inicial...");
    try {
      const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbxVvdtGClw8_8t08zu6eVS9lxu20-Tn5DLLpuBEgLSOmjviICgEv4jtNIU_XVM3kE9Y/exec";
      const response = await fetch(GOOGLE_SHEET_URL, { method: 'GET', redirect: 'follow' });
      if (response.ok) {
        const externalData = await response.json();
        if (Array.isArray(externalData)) {
          const upsert = db.prepare(`
            INSERT INTO products (external_id, name, brand, price, image, color)
            VALUES (@external_id, @name, @brand, @price, @image, @color)
            ON CONFLICT(external_id) DO UPDATE SET
              name = excluded.name,
              brand = excluded.brand,
              price = excluded.price,
              image = excluded.image,
              color = excluded.color
          `);
          const transaction = db.transaction((items) => {
            for (const rawItem of items) {
              const item: any = {};
              Object.keys(rawItem).forEach(key => { item[key.toLowerCase().trim()] = rawItem[key]; });
              const extId = item.id_externo || item.external_id || item.sku || item.id;
              const name = item.nombre || item.name || item.producto;
              if (extId && name) {
                upsert.run({
                  external_id: String(extId).trim(),
                  name: String(name).trim(),
                  brand: String(item.marca || item.brand || "Genérico").trim(),
                  price: parseFloat(item.precio || item.price) || 0,
                  image: String(item.imagen || item.image || item.foto || "https://picsum.photos/600/600").trim(),
                  color: String(item.color || "bg-zinc-200").trim()
                });
              }
            }
          });
          transaction(externalData);
          console.log(`Sincronización inicial completada: ${externalData.length} productos cargados.`);
        }
      }
    } catch (error) {
      console.error("Error en sincronización inicial:", error);
    }
  });
}

startServer();
