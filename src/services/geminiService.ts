import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getChatResponse = async (message: string, history: { role: string, parts: { text: string }[] }[]) => {
  const model = "gemini-3-flash-preview";
  
  const chat = ai.chats.create({
    model: model,
    config: {
      systemInstruction: `Eres el asistente virtual de J3VIRTUALSHOP, una tienda premium de tennis. 
      Tu objetivo es ayudar a los clientes con sus dudas sobre productos, envíos, tallas y políticas de la tienda.
      
      Información de la tienda:
      - Nombre: J3VIRTUALSHOP
      - Productos: Tennis de marcas como Nike, Adidas, Jordan, New Balance, Puma, Reebok.
      - Envíos: Realizamos envíos a todo el país. El envío es gratis en compras seleccionadas.
      - Devoluciones: Tenemos una política de devolución de 30 días si el producto está en perfecto estado.
      - Contacto: Pueden contactarnos por WhatsApp (botón en la web) o redes sociales (Instagram/Facebook).
      
      Sé amable, profesional y conciso. Si no sabes algo, invita al cliente a contactar por WhatsApp para atención personalizada.`,
    },
    history: history,
  });

  const response = await chat.sendMessage({ message });
  return response.text;
};
