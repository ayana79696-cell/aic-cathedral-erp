package ke.aiccathedral.schoolmessenger

import android.content.Context

object Config {
    private const val PREFS = "aic_messenger"
    private const val ENDPOINT = "https://rmarersocrwzqhnbuygi.supabase.co/functions/v1/school-phone-sms"
    private const val DEVICE_TOKEN = "hVgtknd5WD3WHTiO0M2EJnsjR9bfPmCcTQ92AvmEIBI"

    fun endpoint(c: Context): String = ENDPOINT
    fun token(c: Context): String = DEVICE_TOKEN

    fun setLastStatus(c: Context, status: String) {
        c.getSharedPreferences(PREFS, 0).edit().putString("last_status", status).apply()
    }

    fun lastStatus(c: Context): String =
        c.getSharedPreferences(PREFS, 0).getString("last_status", "Ready") ?: "Ready"
}
