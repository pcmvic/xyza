// Este código deve ser salvo num ficheiro chamado: gemini-proxy.js
// Dentro de uma pasta chamada: netlify/functions/

exports.handler = async function(event, context) {
    // Apenas permite pedidos do tipo POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // Obtém o prompt enviado pelo nosso app
        const { prompt } = JSON.parse(event.body);

        // Obtém a sua chave secreta do ambiente seguro do Netlify
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error('A chave da API Gemini não foi configurada no servidor.');
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        
        const payload = {
            contents: [{
                parts: [{ text: prompt }]
            }]
        };

        // O "porteiro" faz a chamada segura ao Google
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Erro da API Gemini:', errorBody);
            return { statusCode: response.status, body: `Erro na API Gemini: ${response.statusText}` };
        }

        const result = await response.json();

        // O "porteiro" devolve a resposta para o app
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result)
        };

    } catch (error) {
        console.error('Erro no porteiro seguro:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Ocorreu um erro interno no servidor.' })
        };
    }
};
