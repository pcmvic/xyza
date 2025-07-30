// Importe o 'fetch' se estiver a usar uma versão do Node.js que não o tenha globalmente.
// O ambiente da Netlify geralmente usa Node.js 18+, onde o fetch é global.
// Se precisar, instale com: npm install node-fetch
// const fetch = require('node-fetch');

// A função handler é o ponto de entrada para a sua Netlify Function.
exports.handler = async (event, context) => {
  // 1. Medida de Segurança: Apenas aceite requisições POST.
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405, // Method Not Allowed
      body: JSON.stringify({ error: 'Método não permitido.' }),
    };
  }

  try {
    // 2. Obter o prompt enviado pelo frontend.
    const { prompt } = JSON.parse(event.body);

    if (!prompt) {
      return {
        statusCode: 400, // Bad Request
        body: JSON.stringify({ error: 'Nenhum prompt foi fornecido.' }),
      };
    }

    // 3. Obter a sua chave da API a partir das variáveis de ambiente da Netlify.
    // NUNCA exponha a sua chave no código do frontend ou do backend.
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("A variável de ambiente GEMINI_API_KEY não está configurada na Netlify.");
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Configuração do servidor incompleta." }),
        };
    }

    // 4. Montar a requisição para a API do Google Gemini.
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{
        parts: [{ text: prompt }],
      }],
    };

    // 5. Fazer a chamada para a API do Gemini.
    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // 6. Verificar se a chamada para o Gemini foi bem-sucedida.
    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error('Erro da API Gemini:', geminiResponse.status, errorBody);
      return {
        statusCode: geminiResponse.status,
        body: JSON.stringify({ error: 'Falha ao comunicar com a API do Gemini.', details: errorBody }),
      };
    }

    // 7. Obter a resposta do Gemini e enviá-la de volta para o seu frontend.
    // É CRUCIAL que o proxy retorne o JSON COMPLETO do Gemini,
    // pois o seu frontend espera a estrutura `candidates[0].content.parts[0].text`.
    const geminiData = await geminiResponse.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Permite que o seu site acesse a função.
      },
      body: JSON.stringify(geminiData),
    };

  } catch (error) {
    console.error('Erro inesperado no proxy:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Ocorreu um erro interno no servidor.' }),
    };
  }
};
