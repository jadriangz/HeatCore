# **IDENTIDAD VISUAL Y PALETA DE COLORES: HEATSTORE TCG**

**Proyecto:** HeatStore TCG / HeatCore ERP

**Fecha:** 16 de Febrero, 2026

**Uso:** Configuración de Theme en Shopify y Tailwind CSS en React.

## **1\. Paleta de Colores Principal (Brand Colors)**

Estos son los colores extraídos directamente de la identidad de tu logo. Deben usarse para botones de acción principal (Call to Action), el navbar y acentos de marca.

* 🔴 **Heat Red (Primario)**  
  * **HEX:** \#FF1A1A  
  * **RGB:** rgb(255, 26, 26\)  
  * **Uso:** Botón de "Comprar" en Shopify, logo, alertas críticas, botones primarios en HeatCore.  
  * **Variante Hover (Más oscuro):** \#CC1414 (Para cuando el usuario pasa el mouse sobre el botón).  
* ⚫ **Core Black (Secundario)**  
  * **HEX:** \#111111  
  * **RGB:** rgb(17, 17, 17\)  
  * **Uso:** Navbar superior, pie de página (Footer), texto principal de alto contraste.  
* ⚪ **Pure White (Fondo)**  
  * **HEX:** \#FFFFFF  
  * **RGB:** rgb(255, 255, 255\)  
  * **Uso:** Fondo de las tarjetas de producto, fondo principal de la tienda.

## **2\. Paleta de Interfaz (UI Neutrals)**

Para el desarrollo de HeatCore, necesitas grises para separar secciones sin saturar la vista (evitar la fatiga visual al procesar guías de envío).

* **Fondo de la App (App Background):** \#F9FAFB (Gris muy claro, ideal para el fondo del ERP).  
* **Bordes y Líneas divisoras:** \#E5E7EB  
* **Texto Secundario (Descripciones sutiles):** \#6B7280  
* **Fondo de inputs/formularios:** \#FFFFFF (Con borde gris).

## **3\. Paleta Semántica (Logística y Operaciones)**

Vital para los estados de pedido en HeatCore y Envia.com.

* 🟢 **Éxito (Success):** \#10B981 (Para estados: *Entregado*, *Guía Generada*, *Pago Aprobado*).  
* 🟡 **Advertencia (Warning):** \#F59E0B (Para estados: *Empacando*, *Stock Bajo*, *Pago Pendiente*).  
* 🔴 **Error / Crítico:** \#EF4444 (Para estados: *Cancelado*, *Devolución*, *Error en Guía*).

## **4\. Tipografía Recomendada**

Para mantener una estética moderna, legible y "Tech-First" acorde a tu diferenciador:

* **Títulos y Logo:** Inter (Font-weight: 700 a 900).  
* **Cuerpo de Texto y ERP:** Inter o System-UI (Font-weight: 400 a 500).

## **5\. Configuración para Tailwind CSS (React / Vite)**

Copia este bloque en tu archivo tailwind.config.js para tener los colores disponibles en todo el proyecto HeatCore:

module.exports \= {  
  theme: {  
    extend: {  
      colors: {  
        brand: {  
          red: '\#FF1A1A',  
          redHover: '\#CC1414',  
          black: '\#111111',  
        },  
        semantic: {  
          success: '\#10B981',  
          warning: '\#F59E0B',  
          error: '\#EF4444',  
        }  
      }  
    }  
  }  
}  
