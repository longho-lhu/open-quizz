import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const usersTable = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  password: text("password"),
  avatar: text("avatar"),
  geminiApiKey: text("gemini_api_key"),
  role: text("role").notNull().default("STUDENT"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const quizzesTable = sqliteTable("quizzes", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  creatorId: text("creator_id").notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  timeLimit: integer("time_limit").notNull().default(15),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const questionsTable = sqliteTable("questions", {
  id: text("id").primaryKey(),
  text: text("text").notNull(),
  quizId: text("quiz_id").notNull().references(() => quizzesTable.id, { onDelete: "cascade" }),
  timeLimit: integer("time_limit").notNull().default(15),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const optionsTable = sqliteTable("options", {
  id: text("id").primaryKey(),
  text: text("text").notNull(),
  isCorrect: integer("is_correct", { mode: "boolean" }).notNull().default(false),
  questionId: text("question_id").notNull().references(() => questionsTable.id, { onDelete: "cascade" }),
});

export const resultsTable = sqliteTable("results", {
  id: text("id").primaryKey(),
  score: integer("score").notNull(),
  studentId: text("student_id").notNull().references(() => usersTable.id),
  quizId: text("quiz_id").notNull().references(() => quizzesTable.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const quizzesRelations = relations(quizzesTable, ({ many, one }) => ({
  questions: many(questionsTable),
  creator: one(usersTable, {
    fields: [quizzesTable.creatorId],
    references: [usersTable.id],
  }),
}));

export const questionsRelations = relations(questionsTable, ({ one, many }) => ({
  quiz: one(quizzesTable, {
    fields: [questionsTable.quizId],
    references: [quizzesTable.id],
  }),
  options: many(optionsTable),
}));

export const optionsRelations = relations(optionsTable, ({ one }) => ({
  question: one(questionsTable, {
    fields: [optionsTable.questionId],
    references: [questionsTable.id],
  }),
}));

export const liveSessionsTable = sqliteTable("live_sessions", {
  id: text("id").primaryKey(),
  quizId: text("quiz_id").notNull().references(() => quizzesTable.id, { onDelete: 'cascade' }),
  hostId: text("host_id").references(() => usersTable.id),
  code: text("code").notNull().unique(),
  name: text("name"), // Optional custom name like "Class 10A2"
  status: text("status").notNull().default("WAITING"), // WAITING, IN_PROGRESS, FINISHED
  feedbackLevel: text("feedback_level").notNull().default("SHOW_ALL"), // SHOW_ALL, SHOW_CORRECT_INCORRECT, SHOW_NOTHING
  randomNicknames: integer("random_nicknames", { mode: "boolean" }).notNull().default(false),
  timeoutWait: integer("timeout_wait", { mode: "boolean" }).notNull().default(false),
  musicTheme: text("music_theme").notNull().default("s1.MP3"),
  currentQuestionIndex: integer("current_question_index").notNull().default(-1),
  startedAt: integer("started_at", { mode: "timestamp" }),
});

export const participantsTable = sqliteTable("participants", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => usersTable.id),
  sessionId: text("session_id").notNull().references(() => liveSessionsTable.id),
  nickname: text("nickname").notNull(),
  randomName: text("random_name").notNull(),
  deviceId: text("device_id"),
  score: integer("score").notNull().default(0),
});

export const participantAnswersTable = sqliteTable("participant_answers", {
  id: text("id").primaryKey(),
  participantId: text("participant_id").notNull().references(() => participantsTable.id),
  questionId: text("question_id").notNull().references(() => questionsTable.id),
  optionId: text("option_id").notNull().references(() => optionsTable.id),
  points: integer("points").notNull().default(0),
  isCorrect: integer("is_correct", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const liveSessionsRelations = relations(liveSessionsTable, ({ one, many }) => ({
  quiz: one(quizzesTable, {
    fields: [liveSessionsTable.quizId],
    references: [quizzesTable.id],
  }),
  participants: many(participantsTable),
}));

export const participantsRelations = relations(participantsTable, ({ one, many }) => ({
  session: one(liveSessionsTable, {
    fields: [participantsTable.sessionId],
    references: [liveSessionsTable.id],
  }),
  user: one(usersTable, {
    fields: [participantsTable.userId],
    references: [usersTable.id],
  }),
  answers: many(participantAnswersTable),
}));

export const participantAnswersRelations = relations(participantAnswersTable, ({ one }) => ({
  participant: one(participantsTable, {
    fields: [participantAnswersTable.participantId],
    references: [participantsTable.id],
  }),
  question: one(questionsTable, {
    fields: [participantAnswersTable.questionId],
    references: [questionsTable.id],
  }),
  option: one(optionsTable, {
    fields: [participantAnswersTable.optionId],
    references: [optionsTable.id],
  }),
}));

export const quizSharesTable = sqliteTable("quiz_shares", {
  id: text("id").primaryKey(),
  quizId: text("quiz_id").notNull().references(() => quizzesTable.id, { onDelete: 'cascade' }),
  shareToEmail: text("share_to_email").notNull(),
  sharedAt: integer("shared_at", { mode: "timestamp" }).notNull(),
});

export const quizSharesRelations = relations(quizSharesTable, ({ one }) => ({
  quiz: one(quizzesTable, {
    fields: [quizSharesTable.quizId],
    references: [quizzesTable.id],
  }),
}));
