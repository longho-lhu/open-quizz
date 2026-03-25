"use client";

import { useState } from "react";
import { createQuiz, updateQuizAction } from "@/app/actions/quiz";
import { generateQuizQuestionsAction } from "@/app/actions/ai";
import { uploadImageAction } from "@/app/actions/upload";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function QuizEditorClient({ 
  initialData, 
  mode = "create",
  quizId
}: { 
  initialData?: any, 
  mode?: "create" | "edit",
  quizId?: string
}) {
  const router = useRouter();
  const t = useTranslations("QuizEditor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiText, setAiText] = useState("");
  const [aiCount, setAiCount] = useState(3);
  const [aiBloomLevel, setAiBloomLevel] = useState("Understanding");
  const [aiLanguage, setAiLanguage] = useState("Vietnamese");
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);

  // Initialize state based on mode
  const defaultQuestions = initialData?.questions && initialData.questions.length > 0 
    ? initialData.questions 
    : [
        {
          id: Date.now(),
          text: "",
          timeLimit: 15,
          options: [
            { id: 1, text: "", isCorrect: true },
            { id: 2, text: "", isCorrect: false },
            { id: 3, text: "", isCorrect: false },
            { id: 4, text: "", isCorrect: false },
          ],
        },
      ];

  const [questions, setQuestions] = useState(defaultQuestions);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now(),
        text: "",
        timeLimit: 15,
        options: [
          { id: 1, text: "", isCorrect: true },
          { id: 2, text: "", isCorrect: false },
          { id: 3, text: "", isCorrect: false },
          { id: 4, text: "", isCorrect: false },
        ],
      },
    ]);
  };

  const updateQuestion = (qId: number, text: string) => {
    setQuestions(questions.map((q: any) => (q.id === qId ? { ...q, text } : q)));
  };

  const updateQuestionTimeLimit = (qId: number, timeLimit: number) => {
    setQuestions(questions.map((q: any) => (q.id === qId ? { ...q, timeLimit } : q)));
  };

  const updateQuestionImage = (qId: number, imageUrl: string) => {
    setQuestions(questions.map((q: any) => (q.id === qId ? { ...q, imageUrl } : q)));
  };

  const uploadQuestionImage = async (qId: number, e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await uploadImageAction(formData);
      if (res.error) {
        setError(res.error);
      } else if (res.url) {
        updateQuestionImage(qId, res.url);
      }
    } catch (err) {
      setError("Failed to upload image");
    }
  };

  const updateOption = (qId: number, oId: number, text: string) => {
    setQuestions(
      questions.map((q: any) => {
        if (q.id === qId) {
          return {
            ...q,
            options: q.options.map((o: any) => (o.id === oId ? { ...o, text } : o)),
          };
        }
        return q;
      })
    );
  };

  const setCorrectOption = (qId: number, oId: number) => {
    setQuestions(
      questions.map((q: any) => {
        if (q.id === qId) {
          return {
            ...q,
            options: q.options.map((o: any) => ({
              ...o,
              isCorrect: o.id === oId,
            })),
          };
        }
        return q;
      })
    );
  };

  const deleteQuestion = (qId: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((q: any) => q.id !== qId));
    }
  };

  const handleGenerateAI = async () => {
    if (!aiTopic && !aiText && !aiFile) {
      setError("Provide a topic, document text, or file for AI generation.");
      return;
    }
    setAiLoading(true);
    setError(null);

    const formData = new FormData();
    if (aiTopic) formData.append("topic", aiTopic);
    if (aiText) formData.append("documentText", aiText);
    formData.append("count", aiCount.toString());
    formData.append("bloomLevel", aiBloomLevel);
    formData.append("language", aiLanguage);
    if (aiFile) formData.append("file", aiFile);

    const res = await generateQuizQuestionsAction(formData);
    if (res.error) {
      setError(res.error);
    } else if (res.questions) {
      const formatted = res.questions.map((q: any) => ({
        id: Date.now() + Math.random(),
        text: q.text,
        timeLimit: 15,
        options: q.options.map((o: any, i: number) => ({
          id: i + 1,
          text: o.text,
          isCorrect: o.isCorrect
        }))
      }));
      
      // If there's only one empty question, replace it
      if (questions.length === 1 && !questions[0].text) {
        setQuestions(formatted);
      } else {
        setQuestions([...questions, ...formatted]);
      }
      
      setShowAiModal(false);
      setAiTopic("");
      setAiText("");
    }
    setAiLoading(false);
  };

  async function handleSubmit(formData: FormData) {
    // Validate empty questions
    for (const q of questions) {
      if (!q.text.trim()) {
        setError("All questions must have text");
        return;
      }
      for (const o of q.options) {
        if (!o.text.trim()) {
          setError("All options must have text");
          return;
        }
      }
    }

    setLoading(true);
    setError(null);
    formData.append("questions", JSON.stringify(questions));
    
    // Pass Quiz ID if we are editing
    if (mode === "edit" && quizId) {
      formData.append("quizId", quizId);
    }

    const res = mode === "create" ? await createQuiz(formData) : await updateQuizAction(formData);
    
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else if (res.success) {
      router.push("/teacher/dashboard");
    }
  }

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6 pb-20">
      <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-brand-purple">
        <h1 className="text-2xl font-black text-brand-dark mb-4">
          {mode === "create" ? t("createTitle") : t("editTitle")}
        </h1>
        
        <form action={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg font-bold">{error}</div>}
          
          <div className="space-y-4 border-b-2 border-gray-100 pb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t("quizTitleLabel")}</label>
              <input
                name="title"
                defaultValue={initialData?.title || ""}
                required
                placeholder={t("quizTitlePlaceholder")}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-brand-purple focus:ring-0 transition-colors font-medium text-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t("descriptionLabel")}</label>
              <textarea
                name="description"
                defaultValue={initialData?.description || ""}
                placeholder={t("descriptionPlaceholder")}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-brand-purple focus:ring-0 transition-colors font-medium outline-none resize-none"
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-8">
            <h2 className="text-xl font-bold text-gray-800">{t("questionsTitle")}</h2>
            <button 
              type="button" 
              onClick={() => setShowAiModal(!showAiModal)} 
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-2 px-4 rounded-xl shadow-md hover:scale-105 transition-transform"
            >
              {t("generateAiBtn")}
            </button>
          </div>

          {showAiModal && (
            <div className="bg-purple-50 rounded-2xl p-6 border-2 border-purple-200 space-y-4 mb-4">
              <h3 className="font-bold text-purple-800 text-lg">{t("aiGeneratorTitle")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{t("topicLabel")}</label>
                  <input value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder={t("topicPlaceholder")} className="w-full bg-white border-2 border-purple-100 rounded-xl px-4 py-2 outline-none focus:border-purple-400" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{t("numQuestionsLabel")}</label>
                  <input type="number" min={1} max={50} value={aiCount} onChange={e => setAiCount(Number(e.target.value))} className="w-full bg-white border-2 border-purple-100 rounded-xl px-4 py-2 outline-none focus:border-purple-400" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{t("bloomLevelLabel")}</label>
                  <select value={aiBloomLevel} onChange={e => setAiBloomLevel(e.target.value)} className="w-full bg-white border-2 border-purple-100 rounded-xl px-4 py-2 outline-none focus:border-purple-400">
                    <option value="Remembering">{t('bloomRemembering')}</option>
                    <option value="Understanding">{t('bloomUnderstanding')}</option>
                    <option value="Applying">{t('bloomApplying')}</option>
                    <option value="Analyzing">{t('bloomAnalyzing')}</option>
                    <option value="Evaluating">{t('bloomEvaluating')}</option>
                    <option value="Creating">{t('bloomCreating')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Language</label>
                  <select value={aiLanguage} onChange={e => setAiLanguage(e.target.value)} className="w-full bg-white border-2 border-purple-100 rounded-xl px-4 py-2 outline-none focus:border-purple-400">
                    <option value="Vietnamese">Tiếng Việt</option>
                    <option value="English">English</option>
                    <option value="French">Français</option>
                    <option value="Spanish">Español</option>
                    <option value="German">Deutsch</option>
                    <option value="Japanese">日本語</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{t("uploadLabel")}</label>
                  <input type="file" accept=".pdf,.txt,.csv,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.rtf,.md,image/*" onChange={e => setAiFile(e.target.files?.[0] || null)} className="w-full bg-white border-2 border-purple-100 rounded-xl px-4 py-1.5 outline-none focus:border-purple-400 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t("pasteLabel")}</label>
                <textarea value={aiText} onChange={e => setAiText(e.target.value)} rows={2} placeholder={t("pastePlaceholder")} className="w-full bg-white border-2 border-purple-100 rounded-xl px-4 py-2 outline-none focus:border-purple-400 resize-none" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowAiModal(false)} className="px-4 py-2 text-purple-600 font-bold hover:bg-purple-100 rounded-lg transition">{t("cancel")}</button>
                <button type="button" onClick={handleGenerateAI} disabled={aiLoading} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-bold shadow-md transition disabled:opacity-50">
                  {aiLoading ? t("generatingBtn") : t("generateBtn")}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-8 mt-4">
            {questions.map((q: any, index: number) => (
              <div key={q.id} className="bg-brand-light rounded-2xl p-6 relative border-2 border-transparent focus-within:border-brand-purple/30 transition-colors">
                <div className="flex justify-between items-center mb-4">
                  <span className="bg-brand-purple text-white px-3 py-1 rounded-full font-bold text-sm shadow-sm">
                    {t("questionNum", { num: index + 1 })}
                  </span>
                  <div className="flex items-center gap-3">
                     <select 
                       value={q.timeLimit} 
                       onChange={(e) => updateQuestionTimeLimit(q.id, Number(e.target.value))}
                       className="bg-white border-2 border-gray-200 rounded-lg px-3 py-1.5 text-sm font-bold focus:border-brand-purple outline-none shadow-sm cursor-pointer"
                     >
                        {[5, 10, 15, 20, 30, 45, 60, 120].map(time => (
                           <option key={time} value={time}>{t("timeSeconds", { time })}</option>
                        ))}
                     </select>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteQuestion(q.id)}
                        className="text-red-500 hover:text-red-700 font-bold bg-white px-3 py-1.5 rounded-lg border-2 border-red-100 shadow-sm"
                      >
                        {t("deleteBtn")}
                      </button>
                    )}
                  </div>
                </div>
                
                <input
                  value={q.text}
                  onChange={(e) => updateQuestion(q.id, e.target.value)}
                  placeholder={t("typeQuestionPlaceholder")}
                  className="w-full text-xl font-bold bg-white border-2 border-gray-200 rounded-xl px-4 py-4 mb-4 focus:border-brand-purple outline-none shadow-sm"
                />

                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                  <input
                    value={q.imageUrl || ""}
                    onChange={(e) => updateQuestionImage(q.id, e.target.value)}
                    placeholder="URL ảnh (vd: https://...)"
                    className="flex-1 bg-white border-2 border-gray-200 rounded-xl px-4 py-2 text-sm font-medium focus:border-brand-purple outline-none shadow-sm"
                  />
                  <div className="relative overflow-hidden inline-block shrink-0 h-[42px] sm:h-auto">
                    <button type="button" className="bg-purple-100 text-purple-700 font-bold px-4 py-2 rounded-xl text-sm border-2 border-purple-200 hover:bg-purple-200 transition h-full flex items-center justify-center w-full sm:w-auto">
                      Tải ảnh lên
                    </button>
                    <input type="file" accept="image/*" onChange={(e) => uploadQuestionImage(q.id, e)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
                </div>
                
                {q.imageUrl && (
                  <div className="mb-6 rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50 flex items-center justify-center p-2 relative">
                    <img src={q.imageUrl} alt="Question" className="max-h-60 max-w-full object-contain rounded-lg" />
                    <button 
                      type="button" 
                      onClick={() => updateQuestionImage(q.id, "")}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold hover:bg-red-600 shadow-md"
                    >
                      X
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {q.options.map((o: any, idx: number) => (
                    <div
                      key={o.id}
                      className={`flex items-center bg-white rounded-xl border-2 p-2 focus-within:ring-2 focus-within:ring-offset-1 transition-all shadow-sm ${
                        o.isCorrect ? "border-brand-green ring-brand-green" : "border-gray-200 hover:border-brand-purple/50"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setCorrectOption(q.id, o.id)}
                        className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mr-3 transition-colors ${
                          o.isCorrect ? "bg-brand-green text-white" : "bg-gray-100 text-transparent hover:bg-gray-200"
                        }`}
                      >
                        ✓
                      </button>
                      <input
                        value={o.text}
                        onChange={(e) => updateOption(q.id, o.id, e.target.value)}
                        placeholder={t("optionPlaceholder", { num: idx + 1 })}
                        className="w-full bg-transparent border-none font-semibold text-gray-700 outline-none placeholder-gray-400"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center py-6">
            <button
              type="button"
              onClick={addQuestion}
              className="btn-secondary flex items-center gap-2 border-brand-purple/20 text-brand-purple"
            >
              <span className="text-xl leading-none">+</span> {t("addQuestionBtn").replace('+', '')}
            </button>
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
            <div className="max-w-4xl mx-auto flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-secondary"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-success px-12"
              >
                {loading ? t("savingBtn") : (mode === "create" ? t("saveQuizBtn") : t("updateQuizBtn"))}
              </button>
            </div>
          </div>
        </form>
      </div>

      {aiLoading && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl relative overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-purple-100">
              <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 w-full animate-pulse"></div>
            </div>
            <div className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-6 shadow-inner">
              <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            </div>
            <h3 className="text-2xl font-black text-gray-800 mb-3 tracking-tight">
              {t("generatingBtn")}
            </h3>
            <p className="text-gray-500 font-medium text-sm leading-relaxed">
              Our AI is analyzing your topic and crafting high-quality questions. This might take a moment...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
