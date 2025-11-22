import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, topicTitle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Analyzing image for topic: ${topicTitle}`);

    // Create a specific prompt based on the topic
    let prompt = "";
    switch (topicTitle) {
      case "Planet Earth":
      case "Earth":
        prompt = "Look at this image carefully. Is the PRIMARY subject of this image Earth, a globe, or planet Earth (in any form - photograph from space, diagram, illustration, 3D model)? You must answer ONLY with the single word 'yes' or 'no'. If Earth is visible but is just part of a larger scene (like a phone screen showing Earth), answer 'yes' if Earth is the main focus. Answer 'yes' ONLY if you can clearly see Earth/globe as the main subject.";
        break;
      case "Human Heart":
        prompt = "Look at this image carefully. Is the PRIMARY subject of this image a human heart (anatomical model, medical diagram, illustration, or artistic representation)? You must answer ONLY with the single word 'yes' or 'no'. Do not provide any explanation.";
        break;
      case "Human Brain":
        prompt = "Look at this image carefully. Is the PRIMARY subject of this image a human brain (anatomical model, medical scan, diagram, or artistic representation)? You must answer ONLY with the single word 'yes' or 'no'. Do not provide any explanation.";
        break;
      default:
        prompt = "What is the main subject of this image? Answer in one sentence.";
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: imageData,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content?.toLowerCase().trim() || "";
    
    console.log(`AI response for ${topicTitle}:`, aiResponse);

    // Check if the AI confirmed it's a match - look for 'yes' as a standalone word or at the start
    const isMatch = aiResponse === "yes" || aiResponse.startsWith("yes") || /\byes\b/.test(aiResponse);

    return new Response(
      JSON.stringify({ isMatch, aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Recognition error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
