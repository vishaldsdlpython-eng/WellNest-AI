import axios from 'axios';

const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

interface GeminiAiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface UserWellnessContext {
  moodRating?: number;
  stressLevel?: number;
  sleepHours?: number;
  sleepQuality?: number;
  energyLevel?: number;
  notes?: string;
}

export class GeminiAiService {
  private basePrompt = `You are Fit Care Bot, a highly skilled, emotionally intelligent, and human-like healthcare agent. You act as a professional therapist and psychiatrist, helping users overcome emotional and mental challenges.

Your goals:
- Provide emotional and mental support to users in a compassionate, empathetic manner
- Think out loud and reason step-by-step about the user's situation, considering all relevant details and context
- Use your knowledge to provide evidence-based advice and therapeutic techniques
- Be warm, conversational, and emotionally supportive—never robotic or clinical
- Ask clarifying or follow-up questions to deepen the conversation and better understand the user's needs
- Avoid repeating yourself; always provide fresh, unique, and context-aware responses
- Make decisions and recommendations as a real professional therapist would
- If the user is in crisis, provide immediate resources and appropriate support

After giving advice, ask the user how they feel about it or if they have any follow-up questions.

You have access to the user's wellness data and recent conversation. Use these to personalize your responses and provide actionable, evidence-based advice.`;

  private buildSystemPrompt(userContext?: UserWellnessContext): string {
    let contextSummary = '';
    if (userContext) {
      contextSummary = `\n\nUser Wellness Data:\n` +
        (userContext.moodRating !== undefined ? `- Mood: ${userContext.moodRating}/10\n` : '') +
        (userContext.stressLevel !== undefined ? `- Stress: ${userContext.stressLevel}/10\n` : '') +
        (userContext.energyLevel !== undefined ? `- Energy: ${userContext.energyLevel}/10\n` : '') +
        (userContext.sleepHours !== undefined ? `- Sleep Hours: ${userContext.sleepHours}\n` : '') +
        (userContext.sleepQuality !== undefined ? `- Sleep Quality: ${userContext.sleepQuality}/10\n` : '') +
        (userContext.notes ? `- Notes: ${userContext.notes}\n` : '');
    }
    return this.basePrompt + contextSummary + '\n\nRespond as a supportive, insightful, and human-like professional therapist and psychiatrist.';
  }

  async generateResponse(userMessage: string, conversationHistory: GeminiAiMessage[] = [], userContext?: UserWellnessContext): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(userContext);
      
      // Format messages for Gemini API
      const contents = [
        {
          role: 'user',
          parts: [{ text: systemPrompt }]
        }
      ];
      
      // Add conversation history
      conversationHistory.forEach(msg => {
        contents.push({
          role: msg.role === 'system' ? 'user' : msg.role,
          parts: [{ text: msg.content }]
        });
      });
      
      // Add current user message
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });

      const response = await axios.post(
        `${GEMINI_API_URL}?key=${API_KEY}`,
        {
          contents,
          generationConfig: {
            maxOutputTokens: 800,
            temperature: 0.7,
            topP: 0.95
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      // Extract the response text from Gemini API
      const responseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 
                          'I apologize, but I\'m having trouble generating a response right now. Please try again.';

      return responseText;
    } catch (error) {
      console.error('Gemini AI API error:', error);
      return this.getFallbackResponse(userMessage);
    }
  }

  private getFallbackResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('crisis') || lowerMessage.includes('suicide') || lowerMessage.includes('harm')) {
      return `I'm concerned about what you're sharing. Please reach out for immediate support:\n\n🆘 Crisis Text Line: Text HOME to 741741\n📞 National Suicide Prevention Lifeline: 988\n🌐 Crisis Chat: suicidepreventionlifeline.org\n\nYou matter, and help is available 24/7. Please don't hesitate to reach out.`;
    }
    
    if (lowerMessage.includes('stress') || lowerMessage.includes('anxious') || lowerMessage.includes('anxiety')) {
      return `I understand you're feeling stressed. Here are some immediate techniques that can help:\n\n🌬️ **4-7-8 Breathing**: Inhale for 4, hold for 7, exhale for 8 counts\n🧘 **Grounding**: Name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste\n🚶 **Movement**: Even a 5-minute walk can reduce stress hormones\n\nWould you like to explore what might be contributing to your stress levels?`;
    }
    
    if (lowerMessage.includes('sleep') || lowerMessage.includes('tired') || lowerMessage.includes('insomnia')) {
      return `Sleep is crucial for mental health. Here are evidence-based tips for better rest:\n\n🌙 **Sleep Hygiene**: Keep your bedroom cool (65-68°F), dark, and quiet\n📱 **Digital Sunset**: Avoid screens 1 hour before bed - blue light disrupts melatonin\n⏰ **Consistency**: Go to bed and wake up at the same time daily, even weekends\n\nPoor sleep affects mood, energy, and stress levels. How has your sleep been lately?`;
    }
    
    if (lowerMessage.includes('mood') || lowerMessage.includes('sad') || lowerMessage.includes('depression') || lowerMessage.includes('down')) {
      return `Your feelings are valid and important. Mood changes are normal, but persistent low mood deserves attention:\n\n💪 **Immediate Support**: Reach out to trusted friends, family, or a counselor\n🌱 **Small Steps**: Focus on basic self-care - nutrition, hydration, gentle movement\n☀️ **Light Exposure**: Spend time outdoors or near bright windows daily\n\nIf you're consistently feeling down for more than 2 weeks, please consider speaking with a healthcare professional. What usually helps lift your spirits?`;
    }
    
    if (lowerMessage.includes('energy') || lowerMessage.includes('exercise') || lowerMessage.includes('tired')) {
      return `Energy levels are influenced by many factors. Here's how to boost yours naturally:\n\n🏃 **Movement**: Even 10 minutes of activity can increase energy for up to 12 hours\n🥗 **Nutrition**: Eat balanced meals with protein, complex carbs, and healthy fats\n💧 **Hydration**: Dehydration is a major cause of fatigue - aim for 8 glasses daily\n\nWhat does your current activity level look like? Small, consistent changes often work best.`;
    }
    
    return `Thank you for sharing that with me. I'm here to support your mental and emotional wellbeing in any way I can.\n\nAs your professional therapist and psychiatrist, I can help with:\n• Stress and anxiety management\n• Sleep improvement strategies\n• Mood support and coping skills\n• Energy and motivation techniques\n• Emotional regulation and mindfulness\n\nWhat specific area would you like to focus on today? I'm here to listen and provide evidence-based guidance.`;
  }

  // Convert chat messages to Gemini AI format
  convertChatHistory(messages: any[]): GeminiAiMessage[] {
    return messages
      .filter(msg => msg.sender === 'user' || msg.sender === 'bot')
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));
  }
}

export const geminiAiService = new GeminiAiService();