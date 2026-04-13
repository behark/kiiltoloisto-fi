import { Booking, Service } from '@prisma/client';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import { siteConfig } from './siteConfig';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export function bookingConfirmationTemplate(
  booking: Booking & { service: Service },
  loyaltyInfo?: {
    tier: string;
    points: number;
    totalPoints: number;
    discount?: number;
    savings?: string;
  }
): EmailTemplate {
  const formattedDate = format(new Date(booking.date), 'EEEE d.M.yyyy', { locale: fi });
  const price = (booking.priceCents / 100).toFixed(2);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: white;
            padding: 30px;
            border: 1px solid #e0e0e0;
            border-radius: 0 0 10px 10px;
          }
          .booking-details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .confirmation-code {
            background: #ffc107;
            color: #000;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #666;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: #28a745;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${siteConfig.name}</h1>
          <p>Varauksesi vahvistus</p>
        </div>
        <div class="content">
          <h2>Hei ${booking.customerName},</h2>
          <p>Kiitos varauksestasi! Olemme vastaanottaneet varauksesi ja odotamme innolla palvelevamme sinua.</p>

          <div class="confirmation-code">
            Vahvistuskoodi: ${booking.confirmationCode}
          </div>

          <div class="booking-details">
            <h3>Varauksen tiedot:</h3>
            <p><strong>Palvelu:</strong> ${booking.service.titleFi}</p>
            <p><strong>Päivämäärä:</strong> ${formattedDate}</p>
            <p><strong>Aika:</strong> ${booking.startTime} - ${booking.endTime}</p>
            <p><strong>Ajoneuvon tyyppi:</strong> ${booking.vehicleType}</p>
            ${booking.licensePlate ? `<p><strong>Rekisterinumero:</strong> ${booking.licensePlate}</p>` : ''}
            <p><strong>Hinta:</strong> ${price} €</p>
            ${booking.notes ? `<p><strong>Lisätiedot:</strong> ${booking.notes}</p>` : ''}
          </div>

          ${loyaltyInfo ? `
          <div class="booking-details" style="background: #e8f5e8; border-left: 4px solid #28a745;">
            <h3>🏆 Kanta-asiakasedut</h3>
            <p><strong>Asiakastaso:</strong> ${loyaltyInfo.tier}</p>
            <p><strong>Pisteet tästä varauksesta:</strong> +${loyaltyInfo.points}</p>
            <p><strong>Pisteesi yhteensä:</strong> ${loyaltyInfo.totalPoints}</p>
            ${loyaltyInfo.discount ? `<p><strong>Asiakasalennus:</strong> ${(loyaltyInfo.discount * 100).toFixed(0)}%</p>` : ''}
            ${loyaltyInfo.savings ? `<p><strong>Säästit:</strong> ${loyaltyInfo.savings}</p>` : ''}
            <p style="font-size: 12px; color: #666;">Kerää pisteitä jokaista euroa kohti ja nouse korkeampiin asiakatasoihin saadaksesi parempia alennuksia!</p>
          </div>
          ` : ''}

          <h3>Osoite:</h3>
          <p>
            ${siteConfig.address.street}<br>
            ${siteConfig.address.postalCode} ${siteConfig.address.city}
          </p>

          <h3>Muistutukset:</h3>
          <ul>
            <li>Saavu paikalle 5 minuuttia ennen varattua aikaa</li>
            <li>Tyhjennä autosi henkilökohtaisista tavaroista</li>
            <li>Ilmoita erikoistoiveet saapuessasi</li>
          </ul>

          <p>Jos sinun tarvitsee perua tai siirtää varauksesi, ota yhteyttä:</p>
          <p>
            Puhelin: <strong>${siteConfig.phone.display}</strong><br>
            Sähköposti: <strong>${siteConfig.email}</strong>
          </p>
        </div>
        <div class="footer">
          <p>${siteConfig.name}</p>
          <p>${siteConfig.address.street}, ${siteConfig.address.postalCode} ${siteConfig.address.city}</p>
          <p>© ${new Date().getFullYear()} Kaikki oikeudet pidätetään</p>
        </div>
      </body>
    </html>
  `;

  const text = `
${siteConfig.name}
Varauksesi vahvistus

Hei ${booking.customerName},

Kiitos varauksestasi! Olemme vastaanottaneet varauksesi ja odotamme innolla palvelevamme sinua.

VAHVISTUSKOODI: ${booking.confirmationCode}

VARAUKSEN TIEDOT:
Palvelu: ${booking.service.titleFi}
Päivämäärä: ${formattedDate}
Aika: ${booking.startTime} - ${booking.endTime}
Ajoneuvon tyyppi: ${booking.vehicleType}
${booking.licensePlate ? `Rekisterinumero: ${booking.licensePlate}` : ''}
Hinta: ${price} €
${booking.notes ? `Lisätiedot: ${booking.notes}` : ''}

OSOITE:
${siteConfig.address.street}
${siteConfig.address.postalCode} ${siteConfig.address.city}

MUISTUTUKSET:
- Saavu paikalle 5 minuuttia ennen varattua aikaa
- Tyhjennä autosi henkilökohtaisista tavaroista
- Ilmoita erikoistoiveet saapuessasi

Jos sinun tarvitsee perua tai siirtää varauksesi, ota yhteyttä:
Puhelin: ${siteConfig.phone.display}
Sähköposti: ${siteConfig.email}

${siteConfig.name}
${siteConfig.address.street}, ${siteConfig.address.postalCode} ${siteConfig.address.city}
© ${new Date().getFullYear()} Kaikki oikeudet pidätetään
  `;

  return {
    subject: `Varausvahvistus - ${siteConfig.name} - ${formattedDate}`,
    html,
    text,
  };
}

export function adminBookingNotificationTemplate(
  booking: Booking & { service: Service }
): EmailTemplate {
  const formattedDate = format(new Date(booking.date), 'EEEE d.M.yyyy', { locale: fi });
  const price = (booking.priceCents / 100).toFixed(2);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e3a5f; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
          .booking-details { background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1e3a5f; }
          .customer-info { background: #fff8e1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Uusi varaus!</h1>
          <p>${siteConfig.name}</p>
        </div>
        <div class="content">
          <h2>Uusi varaus vastaanotettu</h2>

          <div class="booking-details">
            <h3>Varauksen tiedot:</h3>
            <p><strong>Vahvistuskoodi:</strong> ${booking.confirmationCode}</p>
            <p><strong>Palvelu:</strong> ${booking.service.titleFi}</p>
            <p><strong>Päivämäärä:</strong> ${formattedDate}</p>
            <p><strong>Aika:</strong> ${booking.startTime} - ${booking.endTime}</p>
            <p><strong>Ajoneuvon tyyppi:</strong> ${booking.vehicleType}</p>
            ${booking.licensePlate ? `<p><strong>Rekisterinumero:</strong> ${booking.licensePlate}</p>` : ''}
            <p><strong>Hinta:</strong> ${price} €</p>
            ${booking.notes ? `<p><strong>Lisätiedot:</strong> ${booking.notes}</p>` : ''}
          </div>

          <div class="customer-info">
            <h3>Asiakkaan tiedot:</h3>
            <p><strong>Nimi:</strong> ${booking.customerName}</p>
            <p><strong>Sähköposti:</strong> ${booking.customerEmail}</p>
            <p><strong>Puhelin:</strong> ${booking.customerPhone}</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
UUSI VARAUS - ${siteConfig.name}

Vahvistuskoodi: ${booking.confirmationCode}
Palvelu: ${booking.service.titleFi}
Päivämäärä: ${formattedDate}
Aika: ${booking.startTime} - ${booking.endTime}
Ajoneuvon tyyppi: ${booking.vehicleType}
${booking.licensePlate ? `Rekisterinumero: ${booking.licensePlate}` : ''}
Hinta: ${price} €
${booking.notes ? `Lisätiedot: ${booking.notes}` : ''}

ASIAKKAAN TIEDOT:
Nimi: ${booking.customerName}
Sähköposti: ${booking.customerEmail}
Puhelin: ${booking.customerPhone}
  `;

  return {
    subject: `Uusi varaus: ${booking.service.titleFi} - ${formattedDate} klo ${booking.startTime}`,
    html,
    text,
  };
}

export function bookingReminderTemplate(
  booking: Booking & { service: Service }
): EmailTemplate {
  const formattedDate = format(new Date(booking.date), 'EEEE d.M.yyyy', { locale: fi });
  const price = (booking.priceCents / 100).toFixed(2);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: white;
            padding: 30px;
            border: 1px solid #e0e0e0;
            border-radius: 0 0 10px 10px;
          }
          .reminder-box {
            background: #fff3cd;
            border: 2px solid #ffc107;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${siteConfig.name}</h1>
          <p>Muistutus varauksestasi huomenna</p>
        </div>
        <div class="content">
          <h2>Hei ${booking.customerName},</h2>

          <div class="reminder-box">
            <h3>🔔 Muistutus: Varauksesi on huomenna!</h3>
            <p><strong>Aika:</strong> ${booking.startTime}</p>
            <p><strong>Vahvistuskoodi:</strong> ${booking.confirmationCode}</p>
          </div>

          <h3>Varauksen tiedot:</h3>
          <p><strong>Palvelu:</strong> ${booking.service.titleFi}</p>
          <p><strong>Päivämäärä:</strong> ${formattedDate}</p>
          <p><strong>Aika:</strong> ${booking.startTime} - ${booking.endTime}</p>
          <p><strong>Hinta:</strong> ${price} €</p>

          <h3>Osoite:</h3>
          <p>
            ${siteConfig.address.street}<br>
            ${siteConfig.address.postalCode} ${siteConfig.address.city}
          </p>

          <p>Odotamme innolla näkevämme sinut huomenna!</p>
        </div>
      </body>
    </html>
  `;

  const text = `
${siteConfig.name}
Muistutus varauksestasi huomenna

Hei ${booking.customerName},

Muistutus: Varauksesi on huomenna!
Aika: ${booking.startTime}
Vahvistuskoodi: ${booking.confirmationCode}

VARAUKSEN TIEDOT:
Palvelu: ${booking.service.titleFi}
Päivämäärä: ${formattedDate}
Aika: ${booking.startTime} - ${booking.endTime}
Hinta: ${price} €

OSOITE:
${siteConfig.address.street}
${siteConfig.address.postalCode} ${siteConfig.address.city}

Odotamme innolla näkevämme sinut huomenna!
  `;

  return {
    subject: `Muistutus huomisesta varauksesta - ${siteConfig.name}`,
    html,
    text,
  };
}

export function bookingCancellationTemplate(
  booking: Booking & { service: Service }
): EmailTemplate {
  const formattedDate = format(new Date(booking.date), 'EEEE d.M.yyyy', { locale: fi });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: #dc3545;
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: white;
            padding: 30px;
            border: 1px solid #e0e0e0;
            border-radius: 0 0 10px 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${siteConfig.name}</h1>
          <p>Varauksen peruutus</p>
        </div>
        <div class="content">
          <h2>Hei ${booking.customerName},</h2>
          <p>Varauksesi on peruutettu onnistuneesti.</p>

          <h3>Peruutetun varauksen tiedot:</h3>
          <p><strong>Palvelu:</strong> ${booking.service.titleFi}</p>
          <p><strong>Päivämäärä:</strong> ${formattedDate}</p>
          <p><strong>Aika:</strong> ${booking.startTime} - ${booking.endTime}</p>
          <p><strong>Vahvistuskoodi:</strong> ${booking.confirmationCode}</p>

          <p>Jos haluat tehdä uuden varauksen, vieraile verkkosivuillamme tai ota yhteyttä:</p>
          <p>
            Puhelin: <strong>${siteConfig.phone.display}</strong><br>
            Sähköposti: <strong>${siteConfig.email}</strong>
          </p>

          <p>Toivomme näkevämme sinut pian!</p>
        </div>
      </body>
    </html>
  `;

  const text = `
${siteConfig.name}
Varauksen peruutus

Hei ${booking.customerName},

Varauksesi on peruutettu onnistuneesti.

PERUUTETUN VARAUKSEN TIEDOT:
Palvelu: ${booking.service.titleFi}
Päivämäärä: ${formattedDate}
Aika: ${booking.startTime} - ${booking.endTime}
Vahvistuskoodi: ${booking.confirmationCode}

Jos haluat tehdä uuden varauksen, vieraile verkkosivuillamme tai ota yhteyttä:
Puhelin: ${siteConfig.phone.display}
Sähköposti: ${siteConfig.email}

Toivomme näkevämme sinut pian!
  `;

  return {
    subject: `Varauksen peruutus - ${siteConfig.name}`,
    html,
    text,
  };
}

export function paymentConfirmationTemplate(
  booking: Booking & { service: Service }
): EmailTemplate {
  const formattedDate = format(new Date(booking.date), 'EEEE d.M.yyyy', { locale: fi });
  const price = (booking.priceCents / 100).toFixed(2);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: #28a745;
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: white;
            padding: 30px;
            border: 1px solid #e0e0e0;
            border-radius: 0 0 10px 10px;
          }
          .receipt {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${siteConfig.name}</h1>
          <p>Maksuvahvistus</p>
        </div>
        <div class="content">
          <h2>Hei ${booking.customerName},</h2>
          <p>Kiitos maksustasi! Olemme vastaanottaneet maksusi ja varauksesi on nyt vahvistettu.</p>

          <div class="receipt">
            <h3>Kuitti:</h3>
            <p><strong>Palvelu:</strong> ${booking.service.titleFi}</p>
            <p><strong>Päivämäärä:</strong> ${formattedDate}</p>
            <p><strong>Aika:</strong> ${booking.startTime} - ${booking.endTime}</p>
            <p><strong>Summa:</strong> ${price} €</p>
            <p><strong>Maksun tila:</strong> ✅ Maksettu</p>
            <p><strong>Vahvistuskoodi:</strong> ${booking.confirmationCode}</p>
          </div>

          <p>Säilytä tämä kuitti kirjanpitoasi varten.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
${siteConfig.name}
Maksuvahvistus

Hei ${booking.customerName},

Kiitos maksustasi! Olemme vastaanottaneet maksusi ja varauksesi on nyt vahvistettu.

KUITTI:
Palvelu: ${booking.service.titleFi}
Päivämäärä: ${formattedDate}
Aika: ${booking.startTime} - ${booking.endTime}
Summa: ${price} €
Maksun tila: Maksettu
Vahvistuskoodi: ${booking.confirmationCode}

Säilytä tämä kuitti kirjanpitoasi varten.
  `;

  return {
    subject: `Maksuvahvistus - ${siteConfig.name}`,
    html,
    text,
  };
}