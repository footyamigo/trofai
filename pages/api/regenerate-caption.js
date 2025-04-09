import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { currentCaption, currentOption } = req.body;

    if (!currentCaption) {
      return res.status(400).json({ error: 'Current caption is required' });
    }

    const prompt = `As a professional real estate copywriter, please rewrite this property listing caption in a more engaging and sophisticated way. Maintain the key information while making it more appealing and human-centric. Keep the emojis and hashtags, but feel free to enhance their placement.

Important: Do not use any asterisks (*) or markdown formatting in your response. Write the text as plain text with emojis.

Original Caption:
${currentCaption.replace(/\*/g, '')}

Requirements:
1. Keep all the key property information from the original
2. Write with sophistication and warmth, focusing on lifestyle and emotional appeal
3. Use emojis thoughtfully to complement the narrative
4. Keep relevant hashtags but arrange them elegantly
5. Create a distinctly different version that tells a compelling story
6. Keep it concise yet evocative (similar length to original)
7. Do not use any asterisks or special formatting characters

Please write the new caption:`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a highly experienced real estate copywriter who specializes in crafting sophisticated, emotionally resonant property descriptions. You excel at highlighting the lifestyle appeal and unique character of each property while maintaining professionalism and authenticity. Write in plain text with emojis, without using any markdown formatting or asterisks."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    // Remove any remaining asterisks from the generated caption
    const generatedCaption = completion.choices[0].message.content.trim().replace(/\*/g, '');

    return res.status(200).json({ caption: generatedCaption });
  } catch (error) {
    console.error('Error generating caption:', error);
    if (error.code === 'OPENAI_API_ERROR') {
      return res.status(500).json({ error: 'OpenAI API error. Please try again later.' });
    }
    return res.status(500).json({ error: 'Failed to generate caption. Please try again.' });
  }
} 