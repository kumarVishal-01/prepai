import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  geminiApiKey: { type: String, default: null }
}, { timestamps: true });

const DocumentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  id: { type: String, required: true },
  threadId: { type: String, required: false },
  name: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: Number, required: true },
  chunkCount: { type: Number, required: true },
  cloudinaryUrl: { type: String, required: false },
  cloudinaryPublicId: { type: String, required: false },
  status: { type: String, enum: ['PENDING', 'READY', 'FAILED'], default: 'PENDING' },
  hash: { type: String, required: false }
}, { timestamps: true });

DocumentSchema.index({ userId: 1 });
DocumentSchema.index({ userId: 1, hash: 1 });
DocumentSchema.index({ id: 1 }, { unique: true });

const ChunkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  id: { type: String, required: true },
  threadId: { type: String, required: false },
  documentId: { type: String, required: true },
  documentName: { type: String, required: true },
  text: { type: String, required: true },
  embedding: { type: [Number], required: true }
}, { timestamps: true });

ChunkSchema.index({ userId: 1 });
ChunkSchema.index({ documentId: 1 });
ChunkSchema.index({ id: 1 }, { unique: true });

const ThreadSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  id: { type: String, required: true },
  title: { type: String, required: true },
  selectedDocuments: { type: [String], default: [] }
}, { timestamps: true });

ThreadSchema.index({ userId: 1, id: 1 }, { unique: true });

const MessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  threadId: { type: String, required: true },
  role: { type: String, enum: ['user', 'model'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

MessageSchema.index({ userId: 1, threadId: 1 });
MessageSchema.index({ createdAt: 1 });

const InterviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  id: { type: String, required: true },
  role: { type: String, required: true },
  type: { type: String, required: true },
  topic: { type: String, default: '' },
  difficulty: { type: String, required: true },
  useRAG: { type: Boolean, default: false },
  currentQuestionIndex: { type: Number, default: 1 },
  maxQuestions: { type: Number, default: 5 },
  questions: { type: [String], default: [] },
  questionTypes: { type: [String], default: [] },
  answers: { type: [String], default: [] },
  evaluations: { type: Array, default: [] },
  status: { type: String, default: 'active' },
  date: { type: Date, default: Date.now },
  evaluation: { type: mongoose.Schema.Types.Mixed, default: null }
}, { timestamps: true });

InterviewSchema.index({ userId: 1, id: 1 }, { unique: true });

const RoadmapSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  weakTopics: { type: [String], default: [] },
  recommendations: { type: Array, default: [] },
  prepTasks: { type: Array, default: [] }
}, { timestamps: true });

export const User = mongoose.model('User', UserSchema);
export const Document = mongoose.model('Document', DocumentSchema);
export const Chunk = mongoose.model('Chunk', ChunkSchema);
export const Thread = mongoose.model('Thread', ThreadSchema);
export const Message = mongoose.model('Message', MessageSchema);
export const Interview = mongoose.model('Interview', InterviewSchema);
export const Roadmap = mongoose.model('Roadmap', RoadmapSchema);
