/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, X, Plus, Minus, Trash2, ShoppingBag, ChevronRight, MessageCircle, Instagram, Facebook, Phone, RefreshCw, Sparkles, Filter, Search, Play, Film } from 'lucide-react';
import { ChatBot } from './components/ChatBot';

interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  image: string;
  images?: string[];
  color: string;
}

interface CartItem extends Product {
  quantity: number;
}

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Air Max Pulse",
    brand: "Nike",
    price: 159.99,
    image: "https://picsum.photos/seed/sneaker1/600/600",
    color: "bg-blue-500"
  },
  {
    id: 2,
    name: "Ultraboost Light",
    brand: "Adidas",
    price: 189.99,
    image: "https://picsum.photos/seed/sneaker2/600/600",
    color: "bg-zinc-800"
  },
  {
    id: 3,
    name: "Jordan 1 Low",
    brand: "Jordan",
    price: 129.99,
    image: "https://picsum.photos/seed/sneaker3/600/600",
    color: "bg-red-600"
  },
  {
    id: 4,
    name: "550 White/Grey",
    brand: "New Balance",
    price: 109.99,
    image: "https://picsum.photos/seed/sneaker4/600/600",
    color: "bg-stone-400"
  },
  {
    id: 5,
    name: "RS-X Efekt",
    brand: "Puma",
    price: 119.99,
    image: "https://picsum.photos/seed/sneaker5/600/600",
    color: "bg-emerald-500"
  },
  {
    id: 6,
    name: "Classic Leather",
    brand: "Reebok",
    price: 89.99,
    image: "https://picsum.photos/seed/sneaker6/600/600",
    color: "bg-indigo-600"
  }
];

const HERO_SLIDES = [
  { name: "NIKE", image: "https://picsum.photos/seed/nike-hero/1920/1080", color: "text-emerald-500" },
  { name: "NEW BALANCE", image: "https://picsum.photos/seed/nb-hero/1920/1080", color: "text-stone-400" },
  { name: "ADIDAS", image: "https://picsum.photos/seed/adidas-hero/1920/1080", color: "text-zinc-400" },
  { name: "ASICS", image: "https://picsum.photos/seed/asics-hero/1920/1080", color: "text-blue-400" },
];

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', brand: '', price: '' });
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [logoOptions, setLogoOptions] = useState<{url: string, style: string}[]>([]);
  const [isGeneratingLogos, setIsGeneratingLogos] = useState(false);
  const [banners, setBanners] = useState<{id: number, name: string, image: string, color: string}[]>([]);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [newBanner, setNewBanner] = useState({ name: '', image: '', color: 'text-red-500' });
  const [videos, setVideos] = useState<{id: number, title: string, url: string, description: string}[]>([]);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [newVideo, setNewVideo] = useState({ title: '', url: '', description: '' });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [sales, setSales] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [filterBrand, setFilterBrand] = useState('Todos');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    fetchProducts();
    fetchBanners();
    fetchVideos();

    const slideInterval = setInterval(() => {
      const slideCount = banners.length > 0 ? banners.length : HERO_SLIDES.length;
      setCurrentSlide(prev => (prev + 1) % slideCount);
    }, 5000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(slideInterval);
    };
  }, [banners.length]);

  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/banners');
      const data = await response.json();
      setBanners(data);
    } catch (error) {
      console.error('Error fetching banners:', error);
    }
  };

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/videos');
      const data = await response.json();
      setVideos(data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      // If DB is empty, use initial PRODUCTS as fallback/seed
      if (data.length === 0) {
        // Only show mock products if the database is completely empty
        setProducts(PRODUCTS);
      } else {
        const parsedProducts = data.map((p: any) => ({
          ...p,
          images: p.images ? JSON.parse(p.images) : [p.image]
        }));
        // If the user has added their own products, we show only those to avoid mixing real and mock data
        setProducts(parsedProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts(PRODUCTS);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;
    
    // Handle mock products (IDs 1-6)
    if (id <= 6 && products.length === PRODUCTS.length) {
      setProducts(prev => prev.filter(p => p.id !== id));
      return;
    }

    try {
      const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error al eliminar el producto');
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        await fetchProducts();
        alert(data.message);
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('Error al sincronizar el inventario');
    } finally {
      setIsSyncing(false);
    }
  };

  const generateLogos = async () => {
    setIsGeneratingLogos(true);
    setIsLogoModalOpen(true);
    setLogoOptions([]);
    
    const styles = [
      { name: 'Minimalista', prompt: "Minimalist and modern logo for 'J3VIRTUALSHOP'. Clean lines, professional, sans-serif typography, white background, high quality vector style." },
      { name: 'Tecnológico', prompt: "Futuristic and tech-oriented logo for 'J3VIRTUALSHOP'. Neon accents, digital vibes, sleek design, dark background, high quality digital art." },
      { name: 'Streetwear', prompt: "Bold streetwear style logo for 'J3VIRTUALSHOP'. Urban aesthetic, heavy block letters, high contrast, red and black color scheme, high quality graphic design." },
      { name: 'Lujo', prompt: "Luxury and elegant logo for 'J3VIRTUALSHOP'. Gold accents, serif typography, sophisticated symbol, premium feel, high quality professional branding." }
    ];

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: (process.env.GEMINI_API_KEY as string) });
      
      const newLogos = [];
      for (const style of styles) {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: style.prompt }] },
          config: { imageConfig: { aspectRatio: "1:1" } }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            newLogos.push({
              url: `data:image/png;base64,${part.inlineData.data}`,
              style: style.name
            });
            setLogoOptions(prev => [...prev, {
              url: `data:image/png;base64,${part.inlineData.data}`,
              style: style.name
            }]);
          }
        }
      }
    } catch (error) {
      console.error('Error generating logos:', error);
      alert('Error al generar opciones de logo. Por favor intenta de nuevo.');
    } finally {
      setIsGeneratingLogos(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const remainingSlots = 5 - previewImages.length;
      const filesToProcess = Array.from(files).slice(0, remainingSlots) as File[];
      
      filesToProcess.forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImages(prev => [...prev, reader.result as string].slice(0, 5));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePreviewImage = (index: number) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.brand || !newProduct.price || previewImages.length === 0) return;

    const productData = {
      name: newProduct.name,
      brand: newProduct.brand,
      price: parseFloat(newProduct.price),
      image: previewImages[0], // Main image
      images: previewImages,   // All images
      color: 'bg-zinc-200'
    };

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      const savedProduct = await response.json();
      setProducts(prev => [savedProduct, ...prev]);
      setIsUploadModalOpen(false);
      setNewProduct({ name: '', brand: '', price: '' });
      setPreviewImages([]);
      alert('Producto guardado correctamente con sus imágenes.');
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error al guardar el producto');
    }
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || cart.length === 0) return;

    setIsProcessingSale(true);
    const saleData = {
      customer_name: customerName,
      total: cartTotal,
      items: cart,
      receipt_image: receiptImage
    };

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });
      
      if (response.ok) {
        setCart([]);
        setIsCartOpen(false);
        setIsCheckoutModalOpen(false);
        setCustomerName('');
        setReceiptImage(null);
        alert('¡Venta cerrada con éxito! El comprobante ha sido guardado.');
      }
    } catch (error) {
      console.error('Error processing sale:', error);
      alert('Error al procesar la venta');
    } finally {
      setIsProcessingSale(false);
    }
  };

  const fetchSales = async () => {
    try {
      const response = await fetch('/api/sales');
      const data = await response.json();
      setSales(data);
      setIsSalesModalOpen(true);
    } catch (error) {
      console.error('Error fetching sales:', error);
      alert('Error al cargar las ventas');
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewBanner(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const saveBanner = async () => {
    if (!newBanner.image) return;
    try {
      const response = await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBanner)
      });
      if (response.ok) {
        await fetchBanners();
        setIsBannerModalOpen(false);
        setNewBanner({ name: '', image: '', color: 'text-red-500' });
      }
    } catch (error) {
      console.error('Error saving banner:', error);
    }
  };

  const deleteBanner = async (id: number) => {
    if (!confirm('¿Eliminar este banner?')) return;
    try {
      const response = await fetch(`/api/banners/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchBanners();
      }
    } catch (error) {
      console.error('Error deleting banner:', error);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewVideo(prev => ({ ...prev, url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const saveVideo = async () => {
    if (!newVideo.url) return;
    try {
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVideo)
      });
      if (response.ok) {
        await fetchVideos();
        setIsVideoModalOpen(false);
        setNewVideo({ title: '', url: '', description: '' });
      }
    } catch (error) {
      console.error('Error saving video:', error);
    }
  };

  const deleteVideo = async (id: number) => {
    if (!confirm('¿Eliminar este video?')) return;
    try {
      const response = await fetch(`/api/videos/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchVideos();
      }
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredProducts = products.filter(product => {
    const matchesBrand = filterBrand === 'Todos' || product.brand.toLowerCase() === filterBrand.toLowerCase();
    const matchesMinPrice = minPrice === '' || product.price >= parseFloat(minPrice);
    const matchesMaxPrice = maxPrice === '' || product.price <= parseFloat(maxPrice);
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBrand && matchesMinPrice && matchesMaxPrice && matchesSearch;
  });

  const brands = ['Todos', ...new Set(products.map(p => p.brand))];

  const currentHeroSlides = banners.length > 0 ? banners : HERO_SLIDES;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-black tracking-tighter uppercase italic"
          >
            J3VIRTUAL<span className="text-red-600">SHOP</span>
          </motion.h1>
          
          <div className="flex items-center gap-4 sm:gap-8">
            <div className="hidden md:flex gap-6 font-medium text-sm uppercase tracking-widest items-center">
              <a href="#" className="hover:text-red-600 transition-colors">Novedades</a>
              <a href="#" className="hover:text-red-600 transition-colors">Hombre</a>
              <a href="#" className="hover:text-red-600 transition-colors">Mujer</a>
              <a href="#" className="hover:text-red-600 transition-colors">Ofertas</a>
            </div>

            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-zinc-900 text-white px-3 sm:px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center gap-2"
            >
              <Plus className="w-3 h-3" />
              <span className="hidden sm:inline">Subir</span>
            </button>
            
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 hover:bg-zinc-100 rounded-full transition-colors"
            >
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white"
                >
                  {cartCount}
                </motion.span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative h-[90vh] flex items-center overflow-hidden bg-zinc-900 text-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 z-0"
          >
            <img 
              src={currentHeroSlides[currentSlide].image} 
              className="w-full h-full object-cover opacity-30"
              alt={currentHeroSlides[currentSlide].name}
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/60 to-transparent" />
          </motion.div>
        </AnimatePresence>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <span className={`${currentHeroSlides[currentSlide].color || 'text-red-400'} font-bold tracking-[0.3em] uppercase text-sm mb-4 block`}>
              Colección Premium 2026
            </span>
            <h2 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 uppercase">
              {currentHeroSlides[currentSlide].name.split(' ')[0]}<br />
              <span className={currentHeroSlides[currentSlide].color || 'text-red-600'}>{currentHeroSlides[currentSlide].name.split(' ')[1] || 'SHOP'}</span>
            </h2>
            <p className="text-zinc-400 text-lg mb-10 max-w-md">
              Explora lo mejor de {currentHeroSlides[currentSlide].name} y otras marcas exclusivas en nuestra curaduría especial.
            </p>
            <div className="flex gap-4">
              <button className="bg-white text-zinc-900 px-8 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 group">
                Ver Colección
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Carousel Indicators */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {currentHeroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-12 h-1 transition-all rounded-full ${currentSlide === idx ? 'bg-red-600' : 'bg-white/20'}`}
            />
          ))}
        </div>
      </header>

      {/* Video Section */}
      {videos.length > 0 && (
        <section className="py-24 bg-zinc-900 text-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
              <div className="max-w-xl">
                <span className="text-red-500 font-black uppercase tracking-[0.3em] text-xs mb-4 block">Contenido Exclusivo</span>
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-none">
                  J3<span className="text-red-600">VIRTUALSHOP</span>
                </h2>
              </div>
              <p className="text-zinc-400 max-w-sm text-sm uppercase tracking-widest leading-relaxed">
                Descubre el movimiento detrás de cada par. Estilo en alta definición.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {videos.map((video, idx) => (
                <motion.div 
                  key={video.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2 }}
                  className="relative group rounded-[40px] overflow-hidden aspect-video bg-zinc-800 shadow-2xl"
                >
                  <video 
                    src={video.url} 
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700"
                    controls
                    muted
                    loop
                    playsInline
                    autoPlay
                    preload="auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-8 left-8 right-8 pointer-events-none">
                    <h4 className="text-2xl font-black uppercase italic tracking-tighter mb-2">{video.title}</h4>
                    <p className="text-zinc-400 text-xs uppercase tracking-widest font-bold">{video.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Product Grid */}
      <main className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-12">
          <div>
            <h3 className="text-3xl font-black uppercase tracking-tighter">Lanzamientos Destacados</h3>
            <p className="text-zinc-500">Los más buscados de la semana</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setIsAdminMode(!isAdminMode)}
              className={`${isAdminMode ? 'bg-red-600' : 'bg-zinc-900'} text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2`}
            >
              <Trash2 className="w-4 h-4" />
              {isAdminMode ? 'Desactivar Papelera' : 'Activar Papelera'}
            </button>
            <button 
              onClick={() => setIsBannerModalOpen(true)}
              className="bg-zinc-900 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Banners
            </button>
            <button 
              onClick={() => setIsVideoModalOpen(true)}
              className="bg-zinc-900 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <Film className="w-4 h-4" />
              Videos
            </button>
            <button 
              onClick={generateLogos}
              className="bg-zinc-900 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Ideas de Logo
            </button>
            <button 
              onClick={handleSync}
              disabled={isSyncing}
              className="bg-red-600 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-zinc-900 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-red-600 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Subir Producto
            </button>
            <button 
              onClick={fetchSales}
              className="bg-zinc-100 text-zinc-900 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              Ventas
            </button>
            <button className="text-xs font-bold uppercase tracking-widest border-b-2 border-red-500 pb-1 hover:text-red-600 transition-colors">
              Ver Todo
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-12 bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 items-end">
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Buscar</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  type="text" 
                  placeholder="Buscar por nombre o marca..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-red-500 transition-all"
                />
              </div>
            </div>
            
            <div className="w-full md:w-48">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Marca</label>
              <select 
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-500 transition-all appearance-none cursor-pointer"
              >
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-4 w-full md:w-auto">
              <div className="w-full md:w-32">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Precio Min</label>
                <input 
                  type="number" 
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-500 transition-all"
                />
              </div>
              <div className="w-full md:w-32">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Precio Max</label>
                <input 
                  type="number" 
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-500 transition-all"
                />
              </div>
            </div>

            <button 
              onClick={() => {
                setFilterBrand('Todos');
                setMinPrice('');
                setMaxPrice('');
                setSearchQuery('');
              }}
              className="bg-zinc-100 text-zinc-500 p-3 rounded-2xl hover:bg-zinc-200 transition-all"
              title="Limpiar filtros"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {isLoading ? (
            <div className="col-span-full py-20 text-center">
              <div className="animate-spin w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Cargando productos...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <Filter className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No se encontraron productos con esos filtros.</p>
            </div>
          ) : filteredProducts.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group"
            >
              <div className="relative aspect-square bg-zinc-100 rounded-3xl overflow-hidden mb-6">
                <motion.img 
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                    {product.brand}
                  </span>
                  {product.images && product.images.length > 1 && (
                    <div className="flex gap-1">
                      {product.images.map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/50 shadow-sm" />
                      ))}
                    </div>
                  )}
                </div>
                {isAdminMode && (
                  <div className="absolute bottom-4 left-4 flex gap-2 z-20">
                    <motion.button 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProduct(product.id);
                      }}
                      className="bg-red-600 text-white p-3 rounded-2xl hover:bg-red-700 transition-all shadow-xl"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  </div>
                )}
                <button 
                  onClick={() => addToCart(product)}
                  className="absolute bottom-4 right-4 bg-zinc-900 text-white p-4 rounded-2xl opacity-100 translate-y-0 md:opacity-0 md:translate-y-4 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all hover:bg-red-600 shadow-xl"
                >
                  <ShoppingCart className="w-6 h-6" />
                </button>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-lg leading-tight mb-1">{product.name}</h4>
                  <p className="text-zinc-500 text-sm uppercase tracking-widest font-medium">{product.brand}</p>
                </div>
                <p className="font-black text-xl text-red-600">${product.price}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-zinc-900 text-zinc-500 py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <h1 className="text-2xl font-black tracking-tighter uppercase italic text-white mb-6">
              J3VIRTUAL<span className="text-red-600">SHOP</span>
            </h1>
            <p className="max-w-sm mb-8">
              Tu destino premium para el calzado más exclusivo. Únete a nuestra comunidad y no te pierdas ningún drop.
            </p>
            <div className="flex gap-4">
              <motion.a 
                href="https://instagram.com/j3virtualshop" 
                target="_blank" 
                rel="noopener noreferrer"
                whileHover={{ y: -5 }}
                className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center hover:bg-red-600 text-white transition-colors shadow-lg"
              >
                <Instagram className="w-6 h-6" />
              </motion.a>
              <motion.a 
                href="https://facebook.com/j3virtualshop" 
                target="_blank" 
                rel="noopener noreferrer"
                whileHover={{ y: -5 }}
                className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center hover:bg-red-600 text-white transition-colors shadow-lg"
              >
                <Facebook className="w-6 h-6" />
              </motion.a>
            </div>
          </div>
          <div>
            <h5 className="text-white font-bold uppercase tracking-widest text-sm mb-6">Canal de Atención</h5>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-3 group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center group-hover:bg-red-600 transition-colors">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <a href="tel:3144779690" className="hover:text-white transition-colors font-bold tracking-wider">
                  314 477 9690
                </a>
              </li>
              <li><a href="#" className="hover:text-white transition-colors">Envíos y Entregas</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Devoluciones</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-bold uppercase tracking-widest text-sm mb-6">Legal</h5>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Términos de Servicio</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-zinc-800 text-xs flex justify-between">
          <p>© 2024 J3VIRTUALSHOP. Todos los derechos reservados.</p>
          <p>Hecho con pasión por el hype.</p>
        </div>
      </footer>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-bottom flex justify-between items-center bg-zinc-50">
                <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6" />
                  Tu Carrito
                </h2>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-zinc-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-4">
                    <ShoppingBag className="w-16 h-16 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-sm">Tu carrito está vacío</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="text-emerald-600 font-bold uppercase tracking-widest text-xs border-b border-emerald-600"
                    >
                      Empezar a comprar
                    </button>
                  </div>
                ) : (
                  cart.map(item => (
                    <motion.div 
                      layout
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-4 group"
                    >
                      <div className="w-24 h-24 bg-zinc-100 rounded-2xl overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-sm leading-tight">{item.name}</h4>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-zinc-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-zinc-500 text-xs uppercase tracking-widest mb-3">{item.brand}</p>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3 bg-zinc-100 rounded-lg px-2 py-1">
                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-red-600"><Minus className="w-3 h-3" /></button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-red-600"><Plus className="w-3 h-3" /></button>
                          </div>
                          <p className="font-black text-red-600">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 bg-zinc-50 border-t border-zinc-200 space-y-4">
                  <div className="flex justify-between items-center text-zinc-500 text-sm">
                    <span>Subtotal</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-500 text-sm">
                    <span>Envío</span>
                    <span className="text-red-600 font-bold uppercase text-[10px]">Gratis</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-zinc-200">
                    <span className="font-black uppercase tracking-tighter text-xl">Total</span>
                    <span className="font-black text-2xl text-red-600">${cartTotal.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={() => setIsCheckoutModalOpen(true)}
                    className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-red-600 transition-all shadow-lg shadow-zinc-900/10"
                  >
                    Finalizar Compra
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* WhatsApp Floating Button */}
      <motion.a
        href="https://wa.me/573144779690"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring" }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 left-6 sm:bottom-8 sm:left-8 z-40 bg-[#25D366] text-white p-4 rounded-full shadow-2xl flex items-center justify-center hover:bg-[#128C7E] transition-all group"
        title="Chatea con nosotros"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-500 ease-in-out whitespace-nowrap font-bold text-sm">
          ¿Necesitas ayuda?
        </span>
      </motion.a>

      <ChatBot />

      {/* Sales Modal */}
      <AnimatePresence>
        {isSalesModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSalesModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[80vh] bg-white rounded-[2.5rem] shadow-2xl z-[80] overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-zinc-100 flex justify-between items-center">
                <h3 className="text-2xl font-black tracking-tighter uppercase italic">
                  Ventas <span className="text-red-600">Cerradas</span>
                </h3>
                <button onClick={() => setIsSalesModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8">
                {sales.length === 0 ? (
                  <p className="text-center text-zinc-500 py-10">No hay ventas registradas aún.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sales.map((sale) => (
                      <div key={sale.id} className="bg-zinc-50 rounded-3xl p-6 border border-zinc-100">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Cliente</p>
                            <h4 className="font-bold text-lg">{sale.customer_name}</h4>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total</p>
                            <p className="font-black text-xl text-red-600">${sale.total.toFixed(2)}</p>
                          </div>
                        </div>
                        
                        {sale.receipt_image && (
                          <div className="mt-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Comprobante</p>
                            <img 
                              src={sale.receipt_image} 
                              alt="Comprobante" 
                              className="w-full h-48 object-cover rounded-2xl border border-zinc-200"
                            />
                          </div>
                        )}
                        <p className="text-[10px] text-zinc-400 mt-4">{new Date(sale.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Logo Options Modal */}
      <AnimatePresence>
        {isLogoModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10"
          >
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsLogoModalOpen(false)} />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="relative bg-white w-full max-w-4xl rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                <div>
                  <h2 className="text-3xl font-black tracking-tighter uppercase italic">
                    Propuestas de <span className="text-red-600">Logo</span>
                  </h2>
                  <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest mt-1">Identidad Visual para J3VIRTUALSHOP</p>
                </div>
                <button 
                  onClick={() => setIsLogoModalOpen(false)}
                  className="p-3 hover:bg-zinc-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {isGeneratingLogos && logoOptions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-6" />
                    <p className="text-zinc-500 font-bold uppercase tracking-widest animate-pulse">Diseñando opciones exclusivas...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {logoOptions.map((logo, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group relative"
                      >
                        <div className="aspect-square bg-zinc-100 rounded-3xl overflow-hidden border border-zinc-200 shadow-inner">
                          <img 
                            src={logo.url} 
                            alt={`Logo ${logo.style}`}
                            className="w-full h-full object-contain p-4"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                          <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Estilo: {logo.style}</span>
                          <a 
                            href={logo.url} 
                            download={`logo-j3virtualshop-${logo.style.toLowerCase()}.png`}
                            className="bg-zinc-900 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 transition-colors flex items-center gap-2"
                          >
                            Descargar
                          </a>
                        </div>
                      </motion.div>
                    ))}
                    {isGeneratingLogos && (
                      <div className="aspect-square bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mb-3" />
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Generando siguiente estilo...</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-8 bg-zinc-50 border-t border-zinc-100">
                <p className="text-zinc-400 text-[10px] font-medium leading-relaxed uppercase tracking-wider text-center">
                  Estas son propuestas generadas por IA basadas en la identidad de tu marca. <br/>
                  Puedes descargar la que más te guste y usarla en tus redes sociales.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banner Management Modal */}
      <AnimatePresence>
        {isBannerModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10"
          >
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsBannerModalOpen(false)} />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="relative bg-white w-full max-w-4xl rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                <div>
                  <h2 className="text-3xl font-black tracking-tighter uppercase italic">
                    Gestionar <span className="text-red-600">Banners</span>
                  </h2>
                  <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest mt-1">Imágenes de la página principal</p>
                </div>
                <button onClick={() => setIsBannerModalOpen(false)} className="p-3 hover:bg-zinc-200 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <div className="space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Nuevo Banner</h3>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Nombre / Título</label>
                      <input 
                        type="text" 
                        placeholder="Ej: Nueva Colección"
                        value={newBanner.name}
                        onChange={(e) => setNewBanner(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Color de Acento</label>
                      <select 
                        value={newBanner.color}
                        onChange={(e) => setNewBanner(prev => ({ ...prev, color: e.target.value }))}
                        className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-500 transition-all appearance-none cursor-pointer"
                      >
                        <option value="text-red-500">Rojo</option>
                        <option value="text-blue-500">Azul</option>
                        <option value="text-emerald-500">Esmeralda</option>
                        <option value="text-amber-500">Ámbar</option>
                        <option value="text-violet-500">Violeta</option>
                        <option value="text-white">Blanco</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Imagen</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleBannerUpload}
                        className="hidden" 
                        id="banner-upload"
                      />
                      <label 
                        htmlFor="banner-upload"
                        className="flex flex-col items-center justify-center w-full aspect-video bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl cursor-pointer hover:bg-zinc-100 transition-all overflow-hidden"
                      >
                        {newBanner.image ? (
                          <img src={newBanner.image} className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <Plus className="w-8 h-8 text-zinc-300 mb-2" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Seleccionar Imagen</span>
                          </>
                        )}
                      </label>
                    </div>
                    <button 
                      onClick={saveBanner}
                      disabled={!newBanner.image}
                      className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50"
                    >
                      Guardar Banner
                    </button>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Banners Actuales</h3>
                    <div className="grid gap-4">
                      {banners.length === 0 ? (
                        <p className="text-zinc-400 text-xs italic">No hay banners personalizados. Se muestran los de defecto.</p>
                      ) : banners.map(banner => (
                        <div key={banner.id} className="flex gap-4 p-4 bg-zinc-50 rounded-2xl items-center group">
                          <img src={banner.image} className="w-20 h-20 rounded-xl object-cover" />
                          <div className="flex-1">
                            <p className="text-sm font-bold">{banner.name}</p>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${banner.color}`}>Acento Activo</p>
                          </div>
                          <button 
                            onClick={() => deleteBanner(banner.id)}
                            className="p-2 text-zinc-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Management Modal */}
      <AnimatePresence>
        {isVideoModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10"
          >
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsVideoModalOpen(false)} />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="relative bg-white w-full max-w-4xl rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                <div>
                  <h2 className="text-3xl font-black tracking-tighter uppercase italic">
                    Gestionar <span className="text-red-600">Videos</span>
                  </h2>
                  <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest mt-1">Contenido multimedia del Home</p>
                </div>
                <button onClick={() => setIsVideoModalOpen(false)} className="p-3 hover:bg-zinc-200 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <div className="space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Nuevo Video</h3>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Título</label>
                      <input 
                        type="text" 
                        placeholder="Ej: Promo Nike Air"
                        value={newVideo.title}
                        onChange={(e) => setNewVideo(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Descripción</label>
                      <input 
                        type="text" 
                        placeholder="Ej: Nueva colección 2026"
                        value={newVideo.description}
                        onChange={(e) => setNewVideo(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Archivo de Video</label>
                      <input 
                        type="file" 
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden" 
                        id="video-upload"
                      />
                      <label 
                        htmlFor="video-upload"
                        className="flex flex-col items-center justify-center w-full aspect-video bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl cursor-pointer hover:bg-zinc-100 transition-all overflow-hidden"
                      >
                        {newVideo.url ? (
                          <div className="relative w-full h-full">
                            <video 
                              src={newVideo.url} 
                              className="w-full h-full object-cover" 
                              muted 
                              playsInline
                              autoPlay
                              loop
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <Play className="w-12 h-12 text-white opacity-50" />
                            </div>
                          </div>
                        ) : (
                          <>
                            <Film className="w-8 h-8 text-zinc-300 mb-2" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Seleccionar Video</span>
                          </>
                        )}
                      </label>
                    </div>
                    <button 
                      onClick={saveVideo}
                      disabled={!newVideo.url}
                      className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50"
                    >
                      Guardar Video
                    </button>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Videos Actuales</h3>
                    <div className="grid gap-4">
                      {videos.length === 0 ? (
                        <p className="text-zinc-400 text-xs italic">No hay videos agregados.</p>
                      ) : videos.map(video => (
                        <div key={video.id} className="flex gap-4 p-4 bg-zinc-50 rounded-2xl items-center group">
                          <div className="w-20 h-20 rounded-xl bg-zinc-200 overflow-hidden flex items-center justify-center">
                            <Play className="w-6 h-6 text-zinc-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold">{video.title}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 truncate max-w-[150px]">{video.description}</p>
                          </div>
                          <button 
                            onClick={() => deleteVideo(video.id)}
                            className="p-2 text-zinc-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md max-h-[90vh] bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl z-[80] overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black tracking-tighter uppercase italic">
                    Cerrar <span className="text-red-600">Venta</span>
                  </h3>
                  <button onClick={() => setIsCheckoutModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleCheckout} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">Nombre del Cliente</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Nombre completo"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        className="w-full bg-zinc-100 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">Comprobante de Pago (Imagen)</label>
                      <div className="relative group">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleReceiptUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className={`aspect-video rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${receiptImage ? 'border-red-500 bg-red-50' : 'border-zinc-200 bg-zinc-50 group-hover:border-zinc-400'}`}>
                          {receiptImage ? (
                            <img src={receiptImage} alt="Comprobante" className="w-full h-full object-contain p-4" />
                          ) : (
                            <>
                              <Plus className="w-8 h-8 text-zinc-400 mb-2" />
                              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Subir Comprobante</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-100">
                    <div className="flex justify-between items-center mb-6">
                      <span className="font-bold uppercase tracking-widest text-xs text-zinc-500">Total a Pagar</span>
                      <span className="font-black text-2xl text-red-600">${cartTotal.toFixed(2)}</span>
                    </div>
                    
                    <button 
                      type="submit"
                      disabled={isProcessingSale || !customerName}
                      className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isProcessingSale ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        'Confirmar y Guardar Venta'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsUploadModalOpen(false); setPreviewImages([]); }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[80]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 m-auto w-[90%] max-w-lg h-fit max-h-[90vh] bg-white z-[90] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Subir Nuevo Producto</h2>
                  <button onClick={() => { setIsUploadModalOpen(false); setPreviewImages([]); }} className="p-2 hover:bg-zinc-100 rounded-full">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleAddProduct} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">Imágenes (Máx. 5)</label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {previewImages.map((img, idx) => (
                          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200 group">
                            <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                            <button 
                              type="button"
                              onClick={() => removePreviewImage(idx)}
                              className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {previewImages.length < 5 && (
                          <div className="relative aspect-square rounded-xl border-2 border-dashed border-zinc-200 flex items-center justify-center hover:border-red-500 transition-all cursor-pointer group">
                            <input 
                              type="file" 
                              accept="image/*" 
                              multiple
                              onChange={handleImageUpload}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <Plus className="w-6 h-6 text-zinc-400 group-hover:text-red-500" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">Nombre</label>
                        <input 
                          type="text" 
                          placeholder="Ej: Air Force 1"
                          value={newProduct.name}
                          onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                          className="w-full bg-zinc-100 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">Marca</label>
                        <input 
                          type="text" 
                          placeholder="Ej: Nike"
                          value={newProduct.brand}
                          onChange={e => setNewProduct({...newProduct, brand: e.target.value})}
                          className="w-full bg-zinc-100 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">Precio ($)</label>
                      <input 
                        type="number" 
                        placeholder="0.00"
                        value={newProduct.price}
                        onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                        className="w-full bg-zinc-100 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={previewImages.length === 0 || !newProduct.name}
                    className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-red-600 transition-all disabled:opacity-50 disabled:hover:bg-zinc-900"
                  >
                    Agregar a la Tienda
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
