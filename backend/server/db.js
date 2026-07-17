import { Document, Chunk, Interview, Roadmap, Thread, Message } from './models.js';

export const db = {
  // --- Documents (Metadata & Cloudinary Links) ---
  async getDocuments(userId) {
    return Document.find({ userId }).lean();
  },
  async addDocument(doc, userId) {
    const newDoc = new Document({
      ...doc,
      userId
    });
    await newDoc.save();
    return newDoc;
  },
  async updateDocumentStatus(docId, userId, status, extraFields = {}) {
    return Document.findOneAndUpdate(
      { id: docId, userId },
      { $set: { status, ...extraFields } },
      { new: true }
    ).lean();
  },
  async deleteDocument(docId, userId) {
    const doc = await Document.findOne({ id: docId, userId }).lean();
    await Document.deleteOne({ id: docId, userId });
    // Also clean up associated chunks
    await Chunk.deleteMany({ documentId: docId, userId });
    return doc;
  },

  // --- Document Chunks (for RAG) ---
  async getChunks(userId, selectedDocuments) {
    const filter = { userId };
    if (selectedDocuments) {
      if (selectedDocuments.length === 0) {
        return [];
      }
      filter.documentId = { $in: selectedDocuments };
    }
    return Chunk.find(filter).lean();
  },
  async addChunks(newChunks, userId, threadId) {
    const chunks = newChunks.map(c => ({ ...c, userId, threadId }));
    await Chunk.insertMany(chunks);
  },

  // --- Interviews (Mock sessions & evaluation reports) ---
  async getInterviews(userId) {
    return Interview.find({ userId }).lean();
  },
  async addInterview(interview, userId) {
    const newInterview = new Interview({ ...interview, userId });
    await newInterview.save();
    return newInterview;
  },
  async getInterview(id, userId) {
    return Interview.findOne({ id, userId }).lean();
  },
  async updateInterview(id, updatedFields, userId) {
    return Interview.findOneAndUpdate(
      { id, userId },
      { $set: updatedFields },
      { new: true }
    ).lean();
  },

  // --- Roadmap Data ---
  async getRoadmap(userId) {
    let roadmap = await Roadmap.findOne({ userId }).lean();
    if (!roadmap) {
      roadmap = { weakTopics: [], recommendations: [], prepTasks: [] };
    }
    return roadmap;
  },
  async saveRoadmap(roadmap, userId) {
    return Roadmap.findOneAndUpdate(
      { userId },
      { 
        $set: { 
          weakTopics: roadmap.weakTopics, 
          recommendations: roadmap.recommendations, 
          prepTasks: roadmap.prepTasks 
        } 
      },
      { upsert: true, new: true }
    ).lean();
  },

  // --- Chat Threads ---
  async getThreads(userId) {
    return Thread.find({ userId }).lean();
  },
  async addThread(thread, userId) {
    const newThread = new Thread({ ...thread, userId });
    await newThread.save();
    return newThread;
  },
  async getThread(id, userId) {
    const thread = await Thread.findOne({ id, userId }).lean();
    if (thread) {
      // Fetch messages for this thread, sorted by timestamp/createdAt
      const messages = await Message.find({ threadId: id, userId }).sort({ createdAt: 1 }).lean();
      thread.messages = messages;
    }
    return thread;
  },
  async updateThread(id, updatedFields, userId) {
    const fieldsToSet = { ...updatedFields };
    delete fieldsToSet.messages; // Ensure messages array isn't saved to thread document
    return Thread.findOneAndUpdate(
      { id, userId },
      { $set: fieldsToSet },
      { new: true }
    ).lean();
  },
  async deleteThread(id, userId) {
    await Thread.deleteOne({ id, userId });
    await Message.deleteMany({ threadId: id, userId });
    await Chunk.deleteMany({ threadId: id, userId });
  },

  // --- Dedicated Messages Collection ---
  async addMessage(msg, userId) {
    const newMsg = new Message({
      ...msg,
      userId
    });
    await newMsg.save();
    return newMsg;
  },

  // --- Clear Database (Scoped per User) ---
  async clearAll(userId) {
    await Document.deleteMany({ userId });
    await Chunk.deleteMany({ userId });
    await Interview.deleteMany({ userId });
    await Thread.deleteMany({ userId });
    await Message.deleteMany({ userId });
    await Roadmap.deleteOne({ userId });
  }
};
