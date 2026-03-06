import nodemailer from 'nodemailer';

// Email configuration - In a real app, these would come from environment variables
const config = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'your-email@gmail.com', // placeholder
    pass: 'your-app-password', // placeholder
  },
};

const DEFAULT_RECIPIENT = 'peterbaltazar@gmail.com';

/**
 * Sends an email notification with new contracts
 * @param {Array} newContracts 
 */
export async function sendNewContractsEmail(newContracts, recipient = DEFAULT_RECIPIENT) {
  if (!newContracts || newContracts.length === 0) return;

  console.log(`[Email] Pripravujem zaslanie ${newContracts.length} nových zákaziek na ${recipient}`);

  // For demo/test purposes, we'll create a test account using Ethereal if real credentials are not provided
  let transporter;
  
  if (config.auth.user === 'your-email@gmail.com') {
    // Create a test account for demo
    let testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('[Email] Používam testovací Ethereal účet (v produkcii nahraďte reálnym SMTP)');
  } else {
    transporter = nodemailer.createTransport(config);
  }

  const itemsHtml = newContracts.map(item => `
    <div style="border-bottom: 1px solid #eee; padding: 15px 0;">
      <h3 style="margin: 0 0 10px 0; color: #1d4ed8;">${item.title}</h3>
      <p style="margin: 5px 0;"><strong>Obstarávateľ:</strong> ${item.buyer}</p>
      <p style="margin: 5px 0;"><strong>Zdroj:</strong> ${item.source}</p>
      <p style="margin: 5px 0;"><strong>Hodnota:</strong> ${item.value}</p>
      <p style="margin: 5px 0;"><strong>Termín:</strong> ${item.deadline}</p>
      <a href="${item.link}" style="display: inline-block; background: #2563eb; color: white; padding: 8px 15px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Zobraziť detail na portáli</a>
    </div>
  `).join('');

  const mailOptions = {
    from: '"DDD Monitor" <noreply@dddmonitor.sk>',
    to: recipient,
    subject: `🔔 Nové DDD zákazky (${newContracts.length}) - ${new Date().toLocaleDateString('sk-SK')}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h1 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">Monitorovanie trhu DDD</h1>
        <p>Dobrý deň,</p>
        <p>našiel som <strong>${newContracts.length} nových</strong> príležitostí v oblasti deratizácie, dezinsekcie a dezinfekcie, ktoré by vás mohli zaujímať:</p>
        
        ${itemsHtml}
        
        <p style="padding: 20px; background: #f8fafc; border-radius: 8px; margin-top: 20px; font-size: 13px; color: #64748b;">
          Tento e-mail bol vygenerovaný automaticky systémom DDD Monitor. 
          Nastavenia filtrov a CPV kódov môžete kedykoľvek zmeniť vo svojom dashboarde.
        </p>
      </div>
    `,
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log('[Email] Správa úspešne odoslaná: %s', info.messageId);
    if (config.auth.user === 'your-email@gmail.com') {
      console.log('[Email] Ukážka e-mailu: %s', nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (error) {
    console.error('[Email] Chyba pri odosielaní e-mailu:', error);
    throw error;
  }
}
