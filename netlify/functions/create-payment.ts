import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const handler: Handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { service, date, time, clientName, clientPhone, email } = body;

    if (!service || !date || !time || !clientName || !clientPhone) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Parâmetros obrigatórios ausentes.' }),
      };
    }

    const price = Number(service.price);
    if (isNaN(price) || price <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Valor do serviço inválido.' }),
      };
    }

    let appointmentId = '';

    // 1. Salva o agendamento como pendente no Supabase
    if (supabase) {
      const { data, error } = await supabase
        .from('appointments')
        .insert([
          {
            client_name: clientName,
            client_phone: clientPhone,
            service_id: String(service.id),
            date: date,
            time: time + ':00',
            status: 'pending',
            paid: false,
          },
        ])
        .select();

      if (error || !data || data.length === 0) {
        console.error('Erro ao salvar agendamento no Supabase:', error);
        throw new Error('Não foi possível salvar o agendamento no banco de dados.');
      }
      appointmentId = data[0].id;
    } else {
      // Fallback local se o Supabase não estiver configurado
      appointmentId = Math.random().toString(36).substring(2, 9);
    }

    // 2. Cria o pagamento no Mercado Pago
    const mpAccessToken = process.env.MP_ACCESS_TOKEN;
    if (!mpAccessToken) {
      console.warn('MP_ACCESS_TOKEN não configurado. Retornando dados simulados.');
      // Simulação em ambiente local/desenvolvimento sem credenciais do Mercado Pago
      const dummyQrCode = '00020126580014br.gov.bcb.pix0136admin@barbearia.com5204000053039865405' + price.toFixed(2) + '5802BR5913Barbearia6008BRASILIA62070503***63041A2B';
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          isSandbox: true,
          appointment_id: appointmentId,
          payment_id: 'simulated_' + Math.random().toString(36).substring(2, 9),
          qr_code: dummyQrCode,
          qr_code_base64: '',
          ticket_url: 'https://www.mercadopago.com.br',
        }),
      };
    }

    // Nome do pagador
    const nameParts = clientName.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Cliente';
    const lastName = nameParts.slice(1).join(' ') || 'Silva';
    const payerEmail = email || `${clientPhone.replace(/\D/g, '') || 'cliente'}@goldcuts.com`;

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': appointmentId, // Evita pagamento duplicado para o mesmo agendamento
      },
      body: JSON.stringify({
        transaction_amount: price,
        description: `GoldCuts - ${service.name}`,
        payment_method_id: 'pix',
        external_reference: appointmentId,
        payer: {
          email: payerEmail,
          first_name: firstName,
          last_name: lastName,
        },
      }),
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error('Erro na chamada do Mercado Pago:', errorText);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: 'Erro ao gerar o pagamento no Mercado Pago.' }),
      };
    }

    const paymentData = await mpResponse.json();

    const qrCode = paymentData.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 = paymentData.point_of_interaction?.transaction_data?.qr_code_base64;
    const ticketUrl = paymentData.point_of_interaction?.transaction_data?.ticket_url;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        appointment_id: appointmentId,
        payment_id: String(paymentData.id),
        qr_code: qrCode,
        qr_code_base64: qrCodeBase64,
        ticket_url: ticketUrl,
      }),
    };
  } catch (error: any) {
    console.error('Erro no handler create-payment:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Erro interno do servidor.' }),
    };
  }
};
