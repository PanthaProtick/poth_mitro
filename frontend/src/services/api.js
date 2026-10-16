const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      status: 'offline',
      project_name: 'Hackathon Starter API (Unreachable)',
      environment: 'local',
      database_configured: false,
      gemini_configured: false,
      error: err.message
    };
  }
}

export async function sendChatMessage(message, systemInstruction) {
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, system_instruction: systemInstruction })
    });
    if (!res.ok) throw new Error(`Chat error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      reply: `[Client Fallback] Could not reach backend: ${err.message}. Please ensure the FastAPI backend is running on port 8000.`,
      model: 'client-offline-fallback',
      is_mock: true
    };
  }
}

export async function generateIdea(topic, targetAudience) {
  try {
    const res = await fetch(`${API_BASE}/generate-idea`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, target_audience: targetAudience })
    });
    if (!res.ok) throw new Error(`Generation error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      title: `${topic || 'Hackathon'} Solution Hub`,
      tagline: 'Rapid prototyping engine for hackathon validation.',
      target_users: targetAudience || 'Hackathon Participants & End Users',
      core_features: [
        'Instant AI inference and prompt chaining',
        'Decoupled client architecture with FastAPI',
        'Postgres serverless persistence on Neon'
      ],
      suggested_tech_stack: ['React', 'FastAPI', 'Neon', 'Gemini', 'uv'],
      winning_pitch_hook: 'Validates concepts with high velocity and clean modular architecture.'
    };
  }
}

export async function fetchItems() {
  try {
    const res = await fetch(`${API_BASE}/items`);
    if (!res.ok) throw new Error(`Items error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    return [];
  }
}

export async function createItem(item) {
  try {
    const res = await fetch(`${API_BASE}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error(`Create item error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      id: Math.random().toString(36).substring(7),
      title: item.title,
      description: item.description,
      tags: item.tags || [],
      created_at: new Date().toISOString()
    };
  }
}

export async function fetchTeam() {
  try {
    const res = await fetch(`${API_BASE}/team`);
    if (!res.ok) throw new Error(`Team error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      team: [
        {
          name: "Pantha Protick",
          role: "ML & Systems Lead / Backend Engineer",
          strengths: ["Backend", "ML", "Database", "System"]
        },
        {
          name: "Tanvir Hasan Ratul",
          role: "Full-Stack Engineer",
          strengths: ["Backend", "Frontend", "Database"]
        },
        {
          name: "Yousha Shahid",
          role: "Frontend Lead",
          strengths: ["Frontend", "UI/UX"]
        },
        {
          name: "Partha Sarathi Saha Tirtha",
          role: "Full-Stack Engineer",
          strengths: ["Backend", "Frontend", "Database"]
        }
      ]
    };
  }
}
