import { getSession } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { usersTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getApiKey } from "@/app/actions/settings";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const session = await getSession();
  const t = await getTranslations("Settings");

  let dbUser = null;
  if (session?.id) {
    dbUser = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, session.id)
    });
  }
  const currentKey = await getApiKey();

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
        initialApiKey={currentKey || ""}
        dbUser={dbUser}
      />
    </div>
  );
}
