import { mysqlTable, varchar, text, int, boolean, timestamp } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const usersTable = mysqlTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  password: text("password"),
  avatar: text("avatar"),
  localModelPath: text("local_model_path"),
  localModel: text("local_model"),
  role: varchar("role", { length: 50 }).notNull().default("STUDENT"),
  plan: varchar("plan", { length: 50 }).notNull().default("ECO"),
  isVerified: boolean("is_verified").notNull().default(false),
  verificationToken: varchar("verification_token", { length: 255 }),
  resetToken: varchar("reset_token", { length: 255 }),
  resetTokenExpires: timestamp("reset_token_expires"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const teacherApprovalsTable = mysqlTable("teacher_approvals", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 50 }).notNull().default("PENDING"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const quizzesTable = mysqlTable("quizzes", {
  id: varchar("id", { length: 255 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  creatorId: varchar("creator_id", { length: 255 }).notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  timeLimit: int("time_limit").notNull().default(15),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const questionsTable = mysqlTable("questions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  text: text("text").notNull(),
  quizId: varchar("quiz_id", { length: 255 }).notNull().references(() => quizzesTable.id, { onDelete: "cascade" }),
  timeLimit: int("time_limit").notNull().default(15),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const optionsTable = mysqlTable("options", {
  id: varchar("id", { length: 255 }).primaryKey(),
  text: text("text").notNull(),
  isCorrect: boolean("is_correct").notNull().default(false),
  questionId: varchar("question_id", { length: 255 }).notNull().references(() => questionsTable.id, { onDelete: "cascade" }),
});

export const resultsTable = mysqlTable("results", {
  id: varchar("id", { length: 255 }).primaryKey(),
  score: int("score").notNull(),
  studentId: varchar("student_id", { length: 255 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  quizId: varchar("quiz_id", { length: 255 }).notNull().references(() => quizzesTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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

export const liveSessionsTable = mysqlTable("live_sessions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  quizId: varchar("quiz_id", { length: 255 }).notNull().references(() => quizzesTable.id, { onDelete: 'cascade' }),
  hostId: varchar("host_id", { length: 255 }).references(() => usersTable.id, { onDelete: "set null" }),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }), 
  status: varchar("status", { length: 50 }).notNull().default("WAITING"), 
  feedbackLevel: varchar("feedback_level", { length: 50 }).notNull().default("SHOW_ALL"), 
  randomNicknames: boolean("random_nicknames").notNull().default(false),
  timeoutWait: boolean("timeout_wait").notNull().default(false),
  musicTheme: varchar("music_theme", { length: 50 }).notNull().default("s1.MP3"),
  currentQuestionIndex: int("current_question_index").notNull().default(-1),
  progressionMode: varchar("progression_mode", { length: 50 }).notNull().default("AUTO"), 
  startedAt: timestamp("started_at"),
});

export const participantsTable = mysqlTable("participants", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).references(() => usersTable.id, { onDelete: "set null" }),
  sessionId: varchar("session_id", { length: 255 }).notNull().references(() => liveSessionsTable.id, { onDelete: "cascade" }),
  nickname: varchar("nickname", { length: 255 }).notNull(),
  randomName: varchar("random_name", { length: 255 }).notNull(),
  deviceId: varchar("device_id", { length: 255 }),
  score: int("score").notNull().default(0),
});

export const participantAnswersTable = mysqlTable("participant_answers", {
  id: varchar("id", { length: 255 }).primaryKey(),
  participantId: varchar("participant_id", { length: 255 }).notNull().references(() => participantsTable.id, { onDelete: "cascade" }),
  questionId: varchar("question_id", { length: 255 }).notNull().references(() => questionsTable.id, { onDelete: "cascade" }),
  optionId: varchar("option_id", { length: 255 }).notNull().references(() => optionsTable.id, { onDelete: "cascade" }),
  points: int("points").notNull().default(0),
  isCorrect: boolean("is_correct").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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

export const quizSharesTable = mysqlTable("quiz_shares", {
  id: varchar("id", { length: 255 }).primaryKey(),
  quizId: varchar("quiz_id", { length: 255 }).notNull().references(() => quizzesTable.id, { onDelete: 'cascade' }),
  shareToEmail: varchar("share_to_email", { length: 255 }).notNull(),
  sharedAt: timestamp("shared_at").notNull().defaultNow(),
});

export const quizSharesRelations = relations(quizSharesTable, ({ one }) => ({
  quiz: one(quizzesTable, {
    fields: [quizSharesTable.quizId],
    references: [quizzesTable.id],
  }),
}));

export const teacherApprovalsRelations = relations(teacherApprovalsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [teacherApprovalsTable.userId],
    references: [usersTable.id],
  }),
}));
