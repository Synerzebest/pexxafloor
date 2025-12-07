// Définition de la Locale (simplifiée car 'next-intl' n'est pas disponible ici)
type Locale = 'fr' | 'en' | 'nl';

// *******************************************************************
// 1. Définition du type pour les articles (INCHANGÉ)
// *******************************************************************

interface ItemForEmail {
    id: string;
    description: string;
    total_price: number;
    quantity: number;
    type: "product" | "pack";
    slug?: string;
    surface?: number;
}

// *******************************************************************
// 2. Logique de parsing (extraction des articles de haut niveau) (INCHANGÉ)
// *******************************************************************

function parseOrderItems(orderItems: any): ItemForEmail[] {
    let rawItems = orderItems;
    
    if (typeof rawItems === 'string') {
        try {
            rawItems = JSON.parse(rawItems);
        } catch (e) {
            console.error("Erreur critique lors du JSON.parse des articles de commande:", e);
            return [];
        }
    }
    
    if (!Array.isArray(rawItems)) {
        console.error("Les articles parsés ne sont pas un tableau.");
        return [];
    }

    return rawItems.map((item: any) => {
        if (!item || !item.type || !item.quantity) return null;

        if (item.type === 'product' && item.product) {
            const totalPrice = parseFloat((item.product.price * item.quantity).toString());
            if (isNaN(totalPrice)) return null;

            return {
                id: item.product_id || item.id,
                description: item.product.name,
                total_price: totalPrice,
                quantity: item.quantity,
                type: 'product',
            } as ItemForEmail;

        } else if (item.type === 'pack' && item.slug) {
            const packPrice = parseFloat(item.total); 
            if (isNaN(packPrice)) return null;

            return {
                id: item.id,
                description: item.slug, 
                total_price: packPrice,
                quantity: item.quantity,
                type: 'pack',
                slug: item.slug,
                surface: item.surface,
            } as ItemForEmail;
        }
        return null;
        
    }).filter((item: ItemForEmail | null): item is ItemForEmail => item !== null);
}

// *******************************************************************
// 3. Génération du HTML pour la liste des articles et le total (CORRIGÉ POUR TRADUCTION)
// *******************************************************************

function generateOrderDetailsHtml(items: ItemForEmail[], orderTotal: string, locale: Locale): string {
    const t = translations[locale] || translations['fr'];

    if (!items || items.length === 0) {
        return `
            <div style="
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 15px;
                background: #f9fafb;
            ">
                <h3 style="margin:0 0 10px 0; font-size:16px; color:#111827;">${t.recapTitle}</h3>
                <p style='color:#4b5563; font-size:14px;'>${t.noItems}</p>
            </div>
        `;
    }

    const itemsHtml = items
        .map((item) => {
            let itemName = item.description;
            let itemPrice = parseFloat(item.total_price.toString()).toFixed(2);
            let quantityDisplay = '';

            if (item.type === 'pack' && item.slug && item.surface) {
                const packName = item.slug.charAt(0).toUpperCase() + item.slug.slice(1);
                // Le nom du pack n'est pas traduit, c'est un nom de produit
                itemName = `Pack: ${packName} (Surface: ${item.surface}m²)`;
            } 
            
            if (item.quantity > 1) {
                quantityDisplay = `<span style="display:block; font-size:12px; color:#9ca3af;">(x${item.quantity})</span>`;
            }
            
            return `
                <tr style="font-size:14px; color:#4b5563;">
                    <td style="padding:8px 0;">
                        ${itemName}
                        ${quantityDisplay}
                    </td>
                    <td align="right" style="padding:8px 0; font-weight:600;">
                        ${itemPrice} €
                    </td>
                </tr>
            `;
        })
        .join('');

    return `
        <div style="
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            background: #f9fafb;
        ">
            <h3 style="margin:0 0 10px 0; font-size:16px; color:#111827;">${t.recapTitle}</h3>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px; border-collapse:collapse;">
                <tr style="font-size:15px; font-weight:700; color:#111827;">
                    <td style="padding-bottom:10px; border-bottom:1px solid #e5e7eb;">${t.article}</td>
                    <td align="right" style="padding-bottom:10px; border-bottom:1px solid #e5e7eb;">${t.price}</td>
                </tr>
                ${itemsHtml}
            </table>
            
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px; border-collapse:collapse; font-size:15px; color:#111827;">
                <tr>
                    <td style="padding-top:10px; border-top:2px solid #e5e7eb; font-weight:700;">${t.total}</td>
                    <td align="right" style="padding-top:10px; border-top:2px solid #e5e7eb; font-weight:700;">${orderTotal} €</td>
                </tr>
            </table>
        </div>
    `;
}

// *******************************************************************
// 4. Objet de Traduction (INCHANGÉ)
// *******************************************************************
const translations = {
    fr: {
        titlePrefix: "Votre commande",
        statusPaid: "Confirmation de votre commande 🎉",
        statusPreparing: "Votre commande est en préparation 🛠️",
        statusPacked: "Votre commande est emballée 📦",
        statusReady: "Votre commande est prête à être expédiée 🚚✨",
        statusDelivering: "Votre commande est en route ! 🚚💨",
        statusDelivered: "Votre commande a été livrée 📦",
        
        greeting: "Cher client,",
        recapTitle: "Récapitulatif de la commande",
        noItems: "Aucun article dans la commande.",
        article: "Article",
        price: "Prix",
        total: "Total",
        footerThanks: "Merci pour votre confiance,",
        footerTeam: "L’équipe PexxaFloor",
        buttonText: "Voir ma commande",
        
        // Stepper
        step1: "Préparation",
        step2: "Prête à expédier",
        step3: "En cours de livraison",
        step4: "Livrée",
    },
    en: {
        titlePrefix: "Your order",
        statusPaid: "Order confirmation 🎉",
        statusPreparing: "Your order is being prepared 🛠️",
        statusPacked: "Your order is packed 📦",
        statusReady: "Your order is ready to ship 🚚✨",
        statusDelivering: "Your order is on the way! 🚚💨",
        statusDelivered: "Your order has been delivered 📦",

        greeting: "Dear customer,",
        recapTitle: "Order Summary",
        noItems: "No items in the order.",
        article: "Item",
        price: "Price",
        total: "Total",
        footerThanks: "Thank you for your trust,",
        footerTeam: "The PexxaFloor Team",
        buttonText: "View my order",
        
        // Stepper
        step1: "Preparation",
        step2: "Ready to ship",
        step3: "In transit",
        step4: "Delivered",
    },
    nl: {
        titlePrefix: "Uw bestelling",
        statusPaid: "Bestellingsbevestiging 🎉",
        statusPreparing: "Uw bestelling wordt voorbereid 🛠️",
        statusPacked: "Uw bestelling is ingepakt 📦",
        statusReady: "Uw bestelling is klaar voor verzending 🚚✨",
        statusDelivering: "Uw bestelling is onderweg! 🚚💨",
        statusDelivered: "Uw bestelling is geleverd 📦",

        greeting: "Beste klant,",
        recapTitle: "Besteloverzicht",
        noItems: "Geen artikelen in de bestelling.",
        article: "Artikel",
        price: "Prijs",
        total: "Totaal",
        footerThanks: "Bedankt voor uw vertrouwen,",
        footerTeam: "Het PexxaFloor Team",
        buttonText: "Bekijk mijn bestelling",
        
        // Stepper
        step1: "Voorbereiding",
        step2: "Klaar voor verzending",
        step3: "Onderweg",
        step4: "Geleverd",
    },
};

// *******************************************************************
// 5. Fonction pour générer le Stepper HTML (CORRIGÉ POUR TRADUCTION)
// *******************************************************************
function generateStepperHtml(currentStep: number, locale: Locale): string {
    const t = translations[locale] || translations['fr'];

    const steps = [
        { name: t.step1, step: 1 },
        { name: t.step2, step: 2 },
        { name: t.step3, step: 3 },
        { name: t.step4, step: 4 },
    ];
    
    // Conteneur principal pour la barre (méthode de la table <td> pour les blocs)
    const barHtml = steps.map(step => {
        const isColored = step.step <= currentStep;
        const color = isColored ? '#ff7a00' : '#d1d5db';
        
        // Appliquer les bords arrondis uniquement aux extrémités
        let borderRadius = '0';
        if (step.step === 1) {
            borderRadius = '8px 0 0 8px'; // Gauche
        } else if (step.step === 4) {
            borderRadius = '0 8px 8px 0'; // Droite
        }

        return `
            <td width="25%" style="padding:0; line-height: 0;">
                <div style="
                    width:100%; 
                    height:10px; 
                    background:${color};
                    border-radius: ${borderRadius};
                    overflow: hidden;
                    font-size: 1px; /* Réduire la hauteur de ligne pour certains clients mail */
                    line-height: 1px;
                "></div>
            </td>
        `;
    }).join('');

    // HTML des libellés (pour le positionnement)
    const labelsHtml = steps.map(step => {
        const isCurrent = step.step === currentStep;
        return `
            <td width="25%" align="center" style="padding-top: 8px;">
                <div style="
                    font-size:12px; 
                    font-weight:${isCurrent ? 700 : 400};
                    color:${isCurrent ? '#111827' : '#4b5563'};
                    line-height:1.2;
                ">
                    ${step.name}
                </div>
            </td>
        `;
    }).join('');


    return `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:0; border-collapse:collapse;">
            <tr>
                ${barHtml}
            </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
                ${labelsHtml}
            </tr>
        </table>
    `;
}


// *******************************************************************
// 6. Fonction Maîtresse (Template HTML Responsive) (CORRIGÉ POUR TRADUCTION)
// *******************************************************************

interface EmailParams {
    orderId: string;
    orderItems: any; // Raw order.items data
    orderTotal: string;
    emailTitle: string;
    mainText: string;
    statusBadgeText: string;
    statusBadgeBgColor: string;
    statusBadgeTextColor: string;
    link: string;
    currentStep: number; 
    locale: Locale
}

// Sous-titre du logo selon la langue
const logoSubtitleByLocale: Record<Locale, string> = {
  fr: "Chauffage au sol",
  en: "Underfloor heating",
  nl: "Vloerverwarming",
};


export function generateOrderEmailHtml({
    orderId,
    orderItems,
    orderTotal,
    emailTitle,
    mainText,
    statusBadgeText,
    statusBadgeBgColor,
    statusBadgeTextColor,
    link,
    currentStep,
    locale
}: EmailParams): string {
    
    const t = translations[locale] || translations['fr'];
    const productsForEmail = parseOrderItems(orderItems);
    const orderDetailsHtml = generateOrderDetailsHtml(productsForEmail, orderTotal, locale);
    const stepperHtml = generateStepperHtml(currentStep, locale);

    return `
<!DOCTYPE html>
<html lang="${locale}" style="margin:0; padding:0; background:#f5f5f7;">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <style>
      /* Reset standard */
      body { margin: 0; padding: 0; }
      
      /* Media Query pour le Responsive */
      @media only screen and (max-width: 600px) {
        .email-container {
          width: 100% !important;
          max-width: 100% !important;
          padding: 20px 10px !important; 
        }
        .content-card {
            padding: 20px !important; 
        }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background:#f5f5f7; font-family:Arial, sans-serif;">

    <table cellpadding="0" cellspacing="0" width="100%" style="background:#f5f5f7; padding:30px 0;">
      <tr>
        <td align="center">

          <table width="100%" style="max-width:520px; margin-bottom: 20px;">
            <tr>
              <td align="center">
                <div style="font-size:28px; font-weight:800; color:#ff7a00; letter-spacing:0.5px; line-height:1.2;">
                  PexxaFloor
                </div>
                <div style="font-size:14px; font-weight:400; color:#4b5563; line-height:1.2;">
                 ${logoSubtitleByLocale[locale]}
                </div>
              </td>
            </tr>
          </table>
          <table 
            width="100%" 
            class="email-container content-card"
            style="
              max-width:520px; 
              width: 100%; 
              background:white; 
              border-radius:14px; 
              padding:40px; 
              box-shadow:0 3px 10px rgba(0,0,0,0.08);
            "
          >
            
            <tr>
              <td style="font-size:22px; font-weight:600; color:#111827; padding-bottom:15px;">
                ${emailTitle}
              </td>
            </tr>

            <tr>
                <td style="padding:0 0 25px 0;">
                    ${stepperHtml}
                </td>
            </tr>

            <tr>
              <td style="font-size:15px; line-height:1.6; color:#4b5563; padding-bottom:20px;">
                ${t.greeting}<br><br>
                ${mainText}
              </td>
            </tr>
            
            <tr>
                <td style="padding-bottom:25px;">
                    ${orderDetailsHtml}
                </td>
            </tr>

            <tr>
              <td align="left" style="padding-bottom:25px;">
                <span
                  style="
                    display:inline-block;
                    background:${statusBadgeBgColor};
                    color:${statusBadgeTextColor};
                    padding:8px 14px;
                    border-radius:8px;
                    font-size:14px;
                    font-weight:600;
                  "
                >
                  Statut : ${statusBadgeText}
                </span>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding-bottom:30px;">
                <a
                  href="${link}"
                  style="
                    display:inline-block;
                    background:#ff7a00;
                    color:white;
                    padding:12px 22px;
                    border-radius:8px;
                    font-size:15px;
                    font-weight:600;
                    text-decoration:none;
                  "
                >
                  ${t.buttonText}
                </a>
              </td>
            </tr>

            <tr>
              <td>
                <hr style="border:0; border-top:1px solid #e5e7eb; margin:20px 0;" />
              </td>
            </tr>

            <tr>
              <td style="font-size:13px; color:#9ca3af; line-height:1.5;">
                ${t.footerThanks}<br>
                <span style="font-weight:600;">${t.footerTeam}</span>
              </td>
            </tr>
          
          </table>
          </td>
      </tr>
    </table>
    </body>
</html>
    `;
}