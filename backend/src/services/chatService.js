const { GoogleGenerativeAI } = require("@google/generative-ai");
const Appointment = require("../models/Appointment");
const MedicalRecord = require("../models/MedicalRecord");

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MASTER_SYSTEM_PROMPT = `
You are SecureCare Assistant, a friendly, warm, and highly capable virtual assistant for the SecureCare+ hospital management platform. You are an expert on the platform's features but also possess unlimited knowledge of the world.

## 🌟 PERSONALITY
- Supportive & Empathic: Always greet users with care. Every interaction should feel human and reassuring.
- Proactive & Helpful: Never turn a user away. If you don't know a platform-specific detail, offer a helpful general alternative or guide them to support.
- Professional: Use clear, medical-friendly language. No jargon unless speaking to a Doctor.

## 👤 USER ROLES (Contextual Adaptation)
Identify the user's role and adapt your tone and depth accordingly:
1. Patients: Be gentle and use simple terms. Focus on appointments, records, and billing.
2. Doctors & Staff: Be efficient and knowledgeable. Assist with schedules, clinical lookups, and workflows.
3. Admins: Be precise and thorough. Support system management, oversight, and technical tasks.

## 📋 CORE KNOWLEDGE AREAS
### 1. The SecureCare Platform (Primary)
- Appointments: Assist with booking, rescheduling, and doctor availability.
- Medical Records: Help users find test results, history, and prescriptions.
- Billing: Answer questions about invoices, insurance, and payments.
- Navigation: Provide a "GPS" for the site (e.g., "Go to the 'Lab Results' tab on your sidebar").

### 2. General Knowledge (Unlimited)
- Answer ANY question about science, history, lifestyle, technology, or health tips.
- Provide research, writing assistance, and creative brainstorming.
- *Crucial*: For medical concerns, always include: "Please consult with a professional doctor for a personal diagnosis."

## 🧠 MEMORY & CONTINUITY
- You have a perfect memory of this current session. 
- Refer to previous parts of the conversation naturally.
- If the user provides their name, use it warmly.

## 🛡️ CRITICAL GUARDRAILS (Safety & Privacy)
- Emergency Protocol: If a user mentions a life-threatening symptom, immediately advise: "Please call emergency services (911/999) right now."
- Privacy Partition: Never share one user's private data with another role unless explicitly authorized via the platform's consent system.
- No Self-Diagnosis: Never give a definitive medical diagnosis. Always recommend a follow-up with a doctor.
`;

/**
 * Fetches relevant platform context for the AI
 */
const getPlatformContext = async (user) => {
  const context = {
    role: user.role,
    name: user.firstName,
    userId: user.userId,
    upcomingAppointments: [],
    recentRecords: []
  };

  try {
    if (user.role === 'PATIENT') {
      // Fetch upcoming appointments
      const appointments = await Appointment.find({ 
        patientId: user.userId, 
        status: { $in: ['PENDING', 'CONFIRMED'] },
        date: { $gte: new Date() }
      }).limit(3);
      
      context.upcomingAppointments = appointments.map(a => ({
        id: a.appointmentId,
        date: a.date,
        time: a.timeSlot,
        doctor: a.doctorId,
        status: a.status
      }));

      // Fetch recent records
      const records = await MedicalRecord.find({ 
        patientId: user.userId 
      }).sort({ createdAt: -1 }).limit(3);

      context.recentRecords = records.map(r => ({
        title: r.title,
        type: r.recordType,
        date: r.createdAt
      }));
    } else if (user.role === 'DOCTOR') {
      // Fetch today's appointments for doctor
      const appointments = await Appointment.find({ 
        doctorId: user.userId, 
        date: new Date().toISOString().split('T')[0]
      }).limit(5);

      context.upcomingAppointments = appointments.map(a => ({
        patient: a.patientId,
        time: a.timeSlot,
        status: a.status
      }));
    }
  } catch (err) {
    console.error("Context fetch error:", err);
  }

  return context;
};

const getChatResponse = async (user, messages) => {
  try {
    const context = await getPlatformContext(user);
    const fullSystemPrompt = `${MASTER_SYSTEM_PROMPT}\n\nCURRENT USER CONTEXT:\n${JSON.stringify(context, null, 2)}`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: fullSystemPrompt
    });

    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    // Filter history to ensure valid roles (Gemini expects alternating user/model)
    const validHistory = [];
    history.forEach((msg) => {
      // Must start with user
      if (validHistory.length === 0) {
        if (msg.role === 'user') validHistory.push(msg);
        return;
      }
      // Must alternate
      if (msg.role !== validHistory[validHistory.length - 1].role) {
        validHistory.push(msg);
      }
    });

    const chat = model.startChat({
      history: validHistory,
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    const userMessage = messages[messages.length - 1].content;
    console.log(`🤖 Chat request from ${user.firstName} (${user.role}): ${userMessage.substring(0, 50)}...`);

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    const text = response.text();
    
    console.log(`✅ AI Response generated (${text.length} chars)`);
    return text;
  } catch (error) {
    console.error("❌ Gemini Error Details:", {
      message: error.message,
      stack: error.stack,
      status: error.status,
      response: error.response?.data
    });
    throw new Error("Failed to get response from AI Assistant.");
  }
};

module.exports = { getChatResponse };
