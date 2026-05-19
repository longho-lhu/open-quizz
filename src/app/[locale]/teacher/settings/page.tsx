import { getSession } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { usersTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getLocalModelConfig } from "@/app/actions/settings";
import { getLocalModels } from "@/lib/models";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const isLocalServer = process.env.IS_LOCAL_SERVER === 'true';
  const session = await getSession();
  const t = await getTranslations("Settings");

  let dbUser = null;
  if (session?.id) {
    dbUser = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, session.id)
    });
  }
  const currentModelConfig = await getLocalModelConfig();
  const availableModels = await getLocalModels();

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-4xl font-black text-brand-dark">{t("title")}</h1>
           <p className="text-xl font-medium text-gray-500 mt-2">{t("subtitle")}</p>
        </div>
      </div>

      <SettingsClient 
        initialName={dbUser?.name || session?.name || ""} 
        initialAvatar={dbUser?.avatar || ""} 
        initialLocalModelPath={currentModelConfig?.localModelPath || ""}
        initialLocalModel={currentModelConfig?.localModel || ""}
        availableModels={availableModels}
        dbUser={dbUser}
        isLocalServer={isLocalServer}
      />
    </div>
  );
}
