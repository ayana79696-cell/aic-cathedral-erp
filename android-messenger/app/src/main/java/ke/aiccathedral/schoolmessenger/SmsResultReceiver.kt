package ke.aiccathedral.schoolmessenger

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class SmsResultReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val id = intent.getStringExtra("recipient_id") ?: return
        if (intent.action == "AIC_SMS_SENT") {
            val ok = resultCode == android.app.Activity.RESULT_OK
            Thread {
                try {
                    ApiClient.complete(context.applicationContext, id, ok, if (ok) null else "SMS send failed (code $resultCode)")
                } catch (_: Exception) {}
            }.start()
            MainActivityHolder.activity?.onSendResult(ok, id, intent.getIntExtra("index", 0), if (ok) null else "SMS send failed")
        }
    }
}
object MainActivityHolder { var activity: MainActivity? = null }
